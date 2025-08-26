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

import admin from 'firebase-admin';

function initFirebase() {
    if (!process.env.FIREBASE_PROJECT_ID) return null;
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
            }),
        });
    }
    return admin.firestore();
}

const db = initFirebase(); // se envs não estiverem setadas, fica null

function broadcast(type, payload) {
  const msg = JSON.stringify({ type, ...payload });
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', async (data) => {
      try {
          const msg = JSON.parse(String(data));

          if (msg.type === 'auth') {
              const uuid = msg.uuid; // <- você envia do client
              const name = msg.name || 'Unknown';
              const roles = Array.isArray(msg.roles) ? msg.roles : [];
              const accountType = roles.includes('STAFF') ? 'STAFF'
                  : roles.includes('DIAMOND') ? 'DIAMOND'
                      : roles.includes('GOLD') ? 'GOLD'
                          : 'MEMBER';

              connections.set(ws, { uuid, name, roles, accountType, lastSeen: Date.now() });

              // 🔹 Firestore: cria/atualiza o doc em users/{uuid}
              if (db && uuid) {
                  const ref = db.collection('users').doc(uuid);
                  await ref.set({
                      name,
                      roles,
                      accountType,
                      online: true,
                      lastJoin: admin.firestore.FieldValue.serverTimestamp(),
                      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
                  }, { merge: true });
              }

              ws.send(JSON.stringify({ type: 'auth.ok', uuid }));
              broadcast('user.join', { uuid, name, accountType });
          }

          else if (msg.type === 'ping') {
              const state = connections.get(ws);
              if (state) state.lastSeen = Date.now();
              // opcional: atualiza lastSeen no Firestore
              if (db && state?.uuid) {
                  db.collection('users').doc(state.uuid)
                      .set({ lastSeen: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
                      .catch(() => {});
              }
              ws.send(JSON.stringify({ type: 'pong' }));
          }
      } catch (e) {
          console.error('WS message error:', e);
      }
  });
    ws.on('close', async () => {
        const state = connections.get(ws);
        connections.delete(ws);
        if (state?.uuid && db) {
            await db.collection('users').doc(state.uuid).set({
                online: false,
                lastLeave: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true }).catch(() => {});
        }
        if (state?.uuid) broadcast('user.leave', { uuid: state.uuid });
    });
});

setInterval(async () => {
    const now = Date.now();
    for (const ws of wss.clients) {
        if (ws.isAlive === false) {
            const state = connections.get(ws);
            connections.delete(ws);
            ws.terminate();
            if (db && state?.uuid) {
                await db.collection('users').doc(state.uuid).set({
                    online: false,
                    lastLeave: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true }).catch(() => {});
            }
            continue;
        }
        ws.isAlive = false;
        ws.ping(() => {});
        const state = connections.get(ws);
        if (db && state?.uuid && now - (state.lastSeen || 0) > Number(process.env.OFFLINE_AFTER_MS || 120000)) {
            db.collection('users').doc(state.uuid).set({ online: false }, { merge: true }).catch(() => {});
        }
    }
}, Number(process.env.WS_HEARTBEAT_INTERVAL || 30000));

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
