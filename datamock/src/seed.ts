// Firestore Seeder for Game Plan (TypeScript)
// Usage:
// 1) `cp .env.example .env` and fill GOOGLE_APPLICATION_CREDENTIALS path to a service account JSON
// 2) npm install
// 3) npm run seed
import * as fs from "fs";
import * as path from "path";
import * as admin from "firebase-admin";

type ColName =
  | "users" | "profiles" | "contributorApplications" | "creatorPublic" | "creator_profiles"
  | "content" | "coaching_requests" | "events" | "ai_interaction_logs" | "ai_sessions"
  | "ai_content_flags" | "disclaimer_acceptances" | "gear" | "progress" | "availability"
  | "sessions" | "requests";

// Load env and init Firebase Admin
require("dotenv").config();
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

// Helper to convert ISO date strings into Firestore Timestamps deeply
const isIso = (v: any) => typeof v === "string" && /\d{4}-\d{2}-\d{2}T/.test(v);
const reviveTimestamps = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(reviveTimestamps);
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (isIso(v)) out[k] = admin.firestore.Timestamp.fromDate(new Date(v as string));
      else out[k] = reviveTimestamps(v);
    }
    return out;
  }
  return obj;
};

const dataDir = path.join(__dirname, "..", "data");

const readJson = (name: string) => {
  const p = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8"));
};

// Batch writer with chunking
async function writeCollection(col: string, docs: any[], idKey?: string) {
  const chunks: any[][] = [];
  const size = 450; // Firestore limit 500 writes per batch; keep headroom
  for (let i = 0; i < docs.length; i += size) chunks.push(docs.slice(i, i + size));
  let written = 0;
  for (const chunk of chunks) {
    const batch = db.batch();
    for (const doc of chunk) {
      const data = reviveTimestamps(doc);
      let ref;
      if (doc.parent) {
        // For subcollections specifying 'parent' like "notifications/{uid}/messages" or "progress/{uid}/items"
        const [col1, id1, subcol] = (doc.parent as string).split("/");
        if (!col1 || !id1 || !subcol) throw new Error(`Bad parent path: ${doc.parent}`);
        ref = db.collection(col1).doc(id1).collection(subcol).doc(data.id || undefined);
        const dataCopy = { ...data };
        delete dataCopy.parent;
        batch.set(ref, dataCopy, { merge: true });
      } else {
        if (idKey && data[idKey]) {
          ref = db.collection(col).doc(String(data[idKey]));
          batch.set(ref, data, { merge: true });
        } else if (data.id) {
          ref = db.collection(col).doc(String(data.id));
          batch.set(ref, data, { merge: true });
        } else if (data.uid) {
          ref = db.collection(col).doc(String(data.uid));
          batch.set(ref, data, { merge: true });
        } else if (data.slug) {
          ref = db.collection(col).doc(String(data.slug));
          batch.set(ref, data, { merge: true });
        } else {
          ref = db.collection(col).doc();
          batch.set(ref, data, { merge: true });
        }
      }
      written++;
    }
    await batch.commit();
    console.log(`Wrote ${written}/${docs.length} to ${col}`);
  }
}

async function main() {
  const collections: { col: ColName, file: string, idKey?: string }[] = [
    { col: "users", file: "users", idKey: "uid" },
    { col: "profiles", file: "profiles", idKey: "uid" },
    { col: "contributorApplications", file: "contributorApplications" },
    { col: "creatorPublic", file: "creatorPublic", idKey: "slug" },
    { col: "creator_profiles", file: "creator_profiles", idKey: "uid" },
    { col: "content", file: "content", idKey: "id" },
    { col: "coaching_requests", file: "coaching_requests" },
    { col: "events", file: "events" },
    { col: "ai_interaction_logs", file: "ai_interaction_logs" },
    { col: "ai_sessions", file: "ai_sessions" },
    { col: "ai_content_flags", file: "ai_content_flags" },
    { col: "disclaimer_acceptances", file: "disclaimer_acceptances", idKey: "userId" },
    { col: "gear", file: "gear" },
    { col: "progress", file: "progress", idKey: "userId" },
    { col: "availability", file: "availability", idKey: "uid" },
    { col: "sessions", file: "sessions" },
    { col: "requests", file: "requests" },
  ];

  for (const {col, file, idKey} of collections) {
    const docs = readJson(file);
    if (!docs.length) {
      console.log(`Skipping ${col} (no docs)`);
      continue;
    }
    await writeCollection(col, docs, idKey);
  }

  // Subcollections from files with 'parent' fields
  for (const f of ["notifications_messages", "progress_items"]) {
    const docs = readJson(f);
    if (!docs.length) continue;
    await writeCollection("ignored", docs); // 'col' is ignored when 'parent' exists
  }

  console.log("✅ Seeding complete.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
