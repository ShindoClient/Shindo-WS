import http from "http";
import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { config } from "./config.js";
import { log } from "./logger.js";
import { ClientToServer, ConnectionState, AccountType } from "./types.js";
import { markOnline, updateLastSeen, markOffline } from "./presence.js";

export interface Gateway {
    server: http.Server;
    app: express.Express;
    wss: WebSocketServer;
    connections: Map<WebSocket, ConnectionState>;
}

const ALLOWED_ROLES = ["STAFF","DIAMOND","GOLD","MEMBER"] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

function normalizeRoles(input: unknown): AllowedRole[] {
    if (!Array.isArray(input)) return [];
    const cleaned = input
        .map(v => String(v || "").toUpperCase().trim())
        .filter(v => (ALLOWED_ROLES as readonly string[]).includes(v)) as AllowedRole[];
    return cleaned;
}

function normalizeAccountType(input: unknown): AccountType {
    const s = String(input || "").toUpperCase().trim();
    return (s === "MICROSOFT" || s === "OFFLINE") ? (s as AccountType) : "OFFLINE";
}

export function createGateway(): Gateway {
    const app = express();
    app.use(cors());
    app.use(express.json());

    const server = http.createServer(app);
    const wss = new WebSocketServer({ server, path: config.wsPath });
    const connections = new Map<WebSocket, ConnectionState>();

    // Health check endpoint
    app.get("/v1/health", (req, res) => {
        return res.json({
            ok: true,
            startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
            uptimeMs: Math.floor(process.uptime() * 1000)
        });
    });

    // Admin endpoints
    app.get("/v1/connected-users", (req, res) => {
        const users = Array.from(connections.values()).map(v => ({
            uuid: v.uuid, name: v.name, accountType: v.accountType, lastSeen: v.lastSeen
        }));
        res.json({ success: true, users });
    });

    app.post("/v1/broadcast", (req, res) => {
        if ((req.headers["x-admin-key"] || "") !== config.adminKey) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { type, payload } = req.body || {};
        if (!type) return res.status(400).json({ success: false, message: "Missing type" });
        broadcast(wss, { type, ...(payload || {}) });
        return res.json({ success: true });
    });

    // WebSocket
    wss.on("connection", (ws, req) => {
        (ws as any).isAlive = true;
        const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString();
        log.info(`WS connect from ${ip}`);

        ws.on("pong", () => { (ws as any).isAlive = true; });

        ws.on("message", async (data) => {
            try {
                const msg = JSON.parse(String(data)) as ClientToServer;
                switch (msg.type) {
                    case "auth": {
                        const uuid = msg.uuid || uuidv4();
                        const name = msg.name || "Unknown";
                        const roles = normalizeRoles(msg.roles);
                        const accountType = normalizeAccountType(msg.accountType);

                        connections.set(ws, { uuid, name, roles, accountType, lastSeen: Date.now(), isAlive: true });
                        await markOnline(uuid, name, roles, accountType);

                        send(ws, { type: "auth.ok", uuid });
                        broadcast(wss, { type: "user.join", uuid, name, accountType });
                        break;
                    }
                    case "ping": {
                        const state = connections.get(ws);
                        if (state) {
                            state.lastSeen = Date.now();
                            await updateLastSeen(state.uuid);
                        }
                        send(ws, { type: "pong" });
                        break;
                    }
                    default: {
                        log.info(`Unhandled type: ${(msg as any).type}`);
                    }
                }
            } catch (e:any) {
                log.warn("WS parse error: " + e?.message);
            }
        });

        ws.on("close", async () => {
            const state = connections.get(ws);
            connections.delete(ws);
            if (state) {
                await markOffline(state.uuid);
                broadcast(wss, { type: "user.leave", uuid: state.uuid });
            }
            log.info("WS close");
        });

        ws.on("error", (err) => log.warn("WS error: " + err));
    });

    // Heartbeat
    setInterval(async () => {
        for (const ws of wss.clients) {
            const alive = (ws as any).isAlive;
            if (alive === false) {
                const state = connections.get(ws);
                connections.delete(ws);
                ws.terminate();
                if (state) await markOffline(state.uuid);
                continue;
            }
            (ws as any).isAlive = false;
            try { ws.ping(); } catch {}
            const state = connections.get(ws);
            if (state && Date.now() - state.lastSeen > config.offlineAfter) {
                await markOffline(state.uuid);
            }
        }
    }, config.hbInterval);

    server.listen(config.port, () => log.info(`WS listening :${config.port}${config.wsPath}`));
    return { server, app, wss, connections };
}

function send(ws: WebSocket, payload: any) {
    try { ws.send(JSON.stringify(payload)); } catch {}
}
function broadcast(wss: WebSocketServer, payload: any) {
    const msg = JSON.stringify(payload);
    for (const ws of wss.clients) if (ws.readyState === ws.OPEN) ws.send(msg);
}
