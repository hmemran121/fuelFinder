import { adminDb } from "../firebase-admin";
import { getDhakaMidnight, isStale } from "../utils/time-utils";

/**
 * Server-side cleanup service using Firebase Admin SDK.
 * This is designed for automated background tasks like Cron Jobs.
 */
export const serverCleanupService = {
  async performAutoCleanup() {
    console.log("Starting automated midnight cleanup...");
    
    const stationsRef = adminDb.collection("verified_pumps");
    const chatRef = adminDb.collectionGroup("messages");
    
    const stationsSnap = await stationsRef.get();
    const chatSnap = await chatRef.get();
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let totalOperations = 0;
    let batch = adminDb.batch();
    let batchCount = 0;

    const commitBatch = async () => {
      if (batchCount > 0) {
        await batch.commit();
        batch = adminDb.batch();
        batchCount = 0;
      }
    };

    const registerOp = async () => {
      batchCount++;
      totalOperations++;
      if (batchCount >= 500) {
        await commitBatch();
      }
    };

    // 1. Reset Stale Stations
    for (const doc of stationsSnap.docs) {
      const data = doc.data();
      const lastUpdated = data.last_updated;
      
      const isExtremelyOld = data.status === 'unknown' && 
                            lastUpdated && 
                            lastUpdated.toDate() < oneWeekAgo;

      if (isStale(lastUpdated) || isExtremelyOld) {
        batch.update(doc.ref, {
          status: 'unknown',
          category: isExtremelyOld ? 'secondary' : (data.category || 'primary'),
          social_verify_count: 0,
          user_verification_list: [],
          last_updated: new Date() // Use JS Date for Admin SDK
        });
        await registerOp();
      }
    }

    // 2. Clear Stale Chat Messages (DHAKA MIDNIGHT POLICY)
    for (const doc of chatSnap.docs) {
      const data = doc.data();
      if (isStale(data.timestamp)) {
        batch.delete(doc.ref);
        await registerOp();
      }
    }

    // Final commit
    await commitBatch();

    console.log(`Automated cleanup finished. Total operations: ${totalOperations}`);
    return { success: true, count: totalOperations };
  }
};
