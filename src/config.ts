export const config = {
  port: Number(process.env.PORT || 8080),
  wsPath: process.env.WS_PATH || "/websocket",
  adminKey: process.env.ADMIN_KEY || "changeme",
  hbInterval: Number(process.env.WS_HEARTBEAT_INTERVAL || 30000),
  offlineAfter: Number(process.env.OFFLINE_AFTER_MS || 120000),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  },
};
