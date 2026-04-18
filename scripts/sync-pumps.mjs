import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Note: You need a service-account.json file to run this locally!
// Or set GOOGLE_APPLICATION_CREDENTIALS environment variable.

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH;
const pumpDataPath = "h:/Antigravity/FuelFinder/dhaka_pumps.json";

if (!serviceAccountPath) {
  console.error("❌ SERVICE_ACCOUNT_PATH not found in environment variables.");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function syncPumps() {
  const pumps = JSON.parse(readFileSync(pumpDataPath, 'utf8'));
  console.log(`🚀 Starting sync of ${pumps.length} stations...`);

  const batchSize = 500;
  for (let i = 0; i < pumps.length; i += batchSize) {
    const batch = db.batch();
    const chunk = pumps.slice(i, i + batchSize);

    chunk.forEach((pump) => {
      const docRef = db.collection('stations').doc(pump.id.toString());
      batch.set(docRef, {
        ...pump,
        id: pump.id.toString(),
        last_updated: pump.last_updated ? new Date(pump.last_updated) : null,
        created_at: new Date(),
      }, { merge: true });
    });

    await batch.commit();
    console.log(`✅ Synced chunk ${i / batchSize + 1}/${Math.ceil(pumps.length / batchSize)}`);
  }

  console.log("🔥 Sync Complete!");
}

syncPumps().catch(console.error);
