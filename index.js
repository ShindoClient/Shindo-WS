import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 8080;
const WS_PATH = process.env.WS_PATH || '/websocket';
const ADMIN_KEY = process.env.ADMIN_KEY || 'changeme';
const HEARTBEAT = Number(process.env.WS_HEARTBEAT_INTERVAL || 30000);
const OFFLINE_AFTER = Number(process.env.OFFLINE_AFTER_MS || 120000);

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: WS_PATH });

const connections = new Map();

function broadcast(type, payload) {
  const msg = JSON.stringify({ type, ...payload });
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'auth') {
        const uuid = msg.uuid || uuidv4();
        connections.set(ws, { uuid, name: msg.name, roles: msg.roles || [], lastSeen: Date.now() });
        ws.send(JSON.stringify({ type: 'auth.ok', uuid }));
        broadcast('user.join', { uuid, name: msg.name });
      } else if (msg.type === 'ping') {
        const state = connections.get(ws);
        if (state) state.lastSeen = Date.now();
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (e) { console.error(e); }
  });
  ws.on('close', () => {
    const state = connections.get(ws);
    if (state) broadcast('user.leave', { uuid: state.uuid });
    connections.delete(ws);
  });
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  }
}, HEARTBEAT);

// HTTP endpoints
app.get('/v1/handshake', (req, res) => {
  res.json({ success: true, connections: connections.size });
});
app.get('/v1/connected-users', (req, res) => {
  res.json({ users: Array.from(connections.values()) });
});
app.post('/v1/broadcast', (req, res) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({ success: false });
  broadcast(req.body.type, req.body.payload || {});
  res.json({ success: true });
});
app.get('/', (req, res) => res.send('Shindo WS Gateway Running'));

server.listen(PORT, () => console.log(`Listening on :${PORT}${WS_PATH}`));
