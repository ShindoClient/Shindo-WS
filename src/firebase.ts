import admin from "firebase-admin";
import { config } from "./config.js";
import { log } from "./logger.js";

let db: admin.firestore.Firestore | null = null;

export function initFirebase() {
  if (!config.firebase.projectId) {
    log.warn("Firebase not configured; presence disabled.");
    return null;
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      } as admin.ServiceAccount),
    });
  }
  db = admin.firestore();
  log.info("Firebase initialized");
  return db;
}

export { admin };
export function firestore() { return db; }
