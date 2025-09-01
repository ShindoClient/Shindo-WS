import { firestore, admin } from "./firebase.js";
import { log } from "./logger.js";

export async function markOnline(uuid: string, name: string, roles: string[], accountType: string) {
  const db = firestore();
  if (!db) return;
  try {
    const ref = db.collection("users").doc(uuid);
    await ref.set({
      name, roles, accountType, online: true,
      lastJoin: admin.firestore.FieldValue.serverTimestamp(),
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (e:any) { log.warn("markOnline: " + e?.message); }
}

export async function updateLastSeen(uuid: string) {
  const db = firestore();
  if (!db) return;
  try {
    await db.collection("users").doc(uuid).set({
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch {}
}

export async function markOffline(uuid: string) {
  const db = firestore();
  if (!db) return;
  try {
    await db.collection("users").doc(uuid).set({
      online: false,
      lastLeave: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (e:any) { log.warn("markOffline: " + e?.message); }
}
