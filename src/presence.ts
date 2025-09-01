import { firestore, admin } from "./firebase.js";
import type { AccountType } from "./types.js";

export async function markOnline(uuid: string, name: string, roles: string[], accountType: AccountType) {
    const db = firestore();
    if (!db) return;
    await db.collection("users").doc(uuid).set({
        name, roles, accountType,
        online: true,
        lastJoin: admin.firestore.FieldValue.serverTimestamp(),
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}

export async function updateLastSeen(uuid: string) {
    const db = firestore();
    if (!db) return;
    await db.collection("users").doc(uuid).set({
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}

export async function markOffline(uuid: string) {
    const db = firestore();
    if (!db) return;
    await db.collection("users").doc(uuid).set({
        online: false,
        lastLeave: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
