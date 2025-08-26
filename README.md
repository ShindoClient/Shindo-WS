# Shindo WS Gateway (Render ready)

Servidor Express + ws para autenticação e presença dos jogadores.

## Endpoints

- WS: `ws://host/websocket`
- GET `/v1/handshake`
- GET `/v1/connected-users`
- POST `/v1/broadcast` (header `x-admin-key`)

## Deploy on Render

1. Push repo to GitHub.
2. On Render: New → Web Service → connect repo.
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. Env Vars: see `.env.example`
