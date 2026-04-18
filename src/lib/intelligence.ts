import { getFirestore, Timestamp } from 'firebase-admin/firestore';

/**
 * Cloud Function skeleton for Midnight Reset (Dhaka Time UTC+6)
 * This should be deployed as a scheduled function (cron: 0 0 * * *)
 */
export async function resetStationsAtMidnight() {
  const db = getFirestore();
  const stationsRef = db.collection('verified_pumps');
  
  // 1. Fetch all active or inactive stations
  const snapshot = await stationsRef
    .where('status', 'in', ['active', 'inactive'])
    .get();

  if (snapshot.empty) {
    console.log('No stations to reset.');
    return;
  }

  const batch = db.batch();
  
  snapshot.docs.forEach((doc) => {
    // 2. Reset status to unknown
    batch.update(doc.ref, {
      status: 'unknown',
      confidence_score: 0,
      last_reset: Timestamp.now(),
    });
  });

  // 3. Optional: Clear daily chats/verifications
  // await clearDailyLogs();

  await batch.commit();
  console.log(`✅ Reset ${snapshot.size} stations at Dhaka midnight.`);
}

/**
 * Confidence Score Calculation Logic
 * score = (updates * W1) + (verifies * W2) - (decay * TimeDelta)
 */
export function calculateConfidence(
  updates: number, 
  verifies: number, 
  lastUpdateEpoch: number
): number {
  const W_UPDATE = 10;
  const W_VERIFY = 5;
  const DECAY_FACTOR = 0.5; // points per minute
  
  const now = Date.now();
  const minutesSinceUpdate = (now - lastUpdateEpoch) / (1000 * 60);
  
  let score = (updates * W_UPDATE) + (verifies * W_VERIFY);
  score -= (minutesSinceUpdate * DECAY_FACTOR);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
