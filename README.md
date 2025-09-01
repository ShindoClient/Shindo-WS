# Shindo WS Gateway (TypeScript)

- WebSocket server (Express + ws)
- **accountType vem do client**: "MICROSOFT" | "OFFLINE"
- `roles` (array) salvas na Firestore
- keep-alive via ping/pong, marca offline em close/timeout
- Admin HTTP: `GET /v1/connected-users`, `POST /v1/broadcast` (header `x-admin-key`)

## Dev
pnpm install
pnpm dev

## Docker (Render)
Dockerfile com pnpm incluso (multi-stage).
