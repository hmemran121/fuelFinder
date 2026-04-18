import { 
  doc, 
  increment, 
  serverTimestamp, 
  collection, 
  writeBatch,
  arrayUnion,
  updateDoc,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { StationStatus } from "@/types";

export const stationService = {
  /**
   * Updates the status of a fuel station and logs the action (Atomic Batch)
   * Resets social metrics for the new status cycle.
   */
  async updateStatus(
    stationId: string, 
    newStatus: StationStatus, 
    userId: string
  ) {
    const batch = writeBatch(db);
    const stationRef = doc(db, "verified_pumps", stationId);
    const userRef = doc(db, "users", userId);
    const logRef = doc(collection(stationRef, "logs"));

    // 1. Update station status and reliability
    batch.update(stationRef, {
      status: newStatus,
      last_updated: serverTimestamp(),
      last_updated_by: userId,
      confidence_score: increment(5), // Higher confidence gain for status change
      social_verify_count: 0,
      user_verification_list: []
    });

    // 2. Increment user contribution (Atomic Upsert)
    batch.set(userRef, {
      contributionCount: increment(5) // Plus 5 for status change
    }, { merge: true });

    // 3. Log the audit event
    batch.set(logRef, {
      userId,
      type: 'status_change',
      newStatus,
      timestamp: serverTimestamp()
    });

    await batch.commit();
  },

  /**
   * Verified that the station is still active (Social Verification / Check-in)
   * Increments verification count and confidence score.
   */
  async verifyActive(stationId: string, userId: string) {
    const batch = writeBatch(db);
    const stationRef = doc(db, "verified_pumps", stationId);
    const userRef = doc(db, "users", userId);
    const logRef = doc(collection(stationRef, "logs"));

    // 1. Update Station Metrics
    batch.update(stationRef, {
      social_verify_count: increment(1),
      confidence_score: increment(1), // Gain 1 confidence point
      last_updated: serverTimestamp(),
      user_verification_list: arrayUnion(userId)
    });

    // 2. Increment User Contribution
    batch.set(userRef, {
      contributionCount: increment(1)
    }, { merge: true });

    // 3. Log the activity
    batch.set(logRef, {
      userId,
      type: 'social_verify',
      timestamp: serverTimestamp()
    });

    await batch.commit();
  },

  /**
   * Navigation link generator
   */
  getGoogleMapsLink(latitude: number, longitude: number) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
};
