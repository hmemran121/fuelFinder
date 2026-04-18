import { 
  collection, 
  collectionGroup,
  doc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  increment,
  writeBatch,
  getDoc,
  where,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Station, UserProfile } from "@/types";
import { getNearestArea } from "../utils/geo-utils";

export interface SystemStats {
  totalUsers: number;
  totalStations: number;
  activeStations: number;
  verifiedCount: number;
}

export interface ActivityLog {
  id: string;
  type: string;
  stationId?: string;
  userId: string;
  userName?: string;
  timestamp: any;
  details?: string;
}

export interface Broadcast {
  id: string;
  text: string;
  priority: 'regular' | 'warning' | 'critical';
  expiresAt: any;
  createdAt: any;
  active: boolean;
}

export const adminService = {
  /**
   * Fetch system-wide stats
   */
  async getSystemStats(): Promise<SystemStats> {
    const stationsSnap = await getDocs(collection(db, "verified_pumps"));
    const usersSnap = await getDocs(collection(db, "users"));
    
    const stations = stationsSnap.docs.map(d => d.data());
    
    return {
      totalUsers: usersSnap.size,
      totalStations: stationsSnap.size,
      activeStations: stations.filter(s => s.status === 'active').length,
      verifiedCount: stations.filter(s => s.isVerified).length
    };
  },

  /**
   * Fetch latest activity logs
   */
  async getRecentLogs(listLimit: number = 20): Promise<ActivityLog[]> {
    const q = query(
      collection(db, "updates"),
      orderBy("timestamp", "desc"),
      limit(listLimit)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityLog[];
  },

  /**
   * Station CRUD
   */
  async addStation(station: Omit<Station, 'id'>) {
    // Auto-detect area if coords are provided but area is missing
    const area = station.area || getNearestArea(station.latitude, station.longitude);
    
    return await addDoc(collection(db, "verified_pumps"), {
      ...station,
      area,
      createdAt: serverTimestamp(),
      last_updated: serverTimestamp()
    });
  },

  async updateStation(id: string, data: Partial<Station>) {
    const ref = doc(db, "verified_pumps", id);
    let updateData = { ...data, last_updated: serverTimestamp() };

    // Auto-detect area if coords changed but area wasn't explicitly updated
    if ((data.latitude || data.longitude) && !data.area) {
      const currentSnap = await getDoc(ref);
      if (currentSnap.exists()) {
        const cur = currentSnap.data() as Station;
        const lat = data.latitude || cur.latitude;
        const lng = data.longitude || cur.longitude;
        (updateData as any).area = getNearestArea(lat, lng);
      }
    }

    return await updateDoc(ref, updateData);
  },

  async deleteStation(id: string) {
    return await deleteDoc(doc(db, "verified_pumps", id));
  },

  /**
   * Content Moderation
   */
  async getGlobalChatFeed(listLimit: number = 50): Promise<any[]> {
    const q = query(
      collectionGroup(db, "messages"),
      orderBy("timestamp", "desc"),
      limit(listLimit)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ 
      id: doc.id, 
      path: doc.ref.path, 
      ...doc.data() 
    }));
  },

  async deleteChatMessage(path: string) {
    // path format: pump_daily_chats/{stationId}/messages/{msgId}
    return await deleteDoc(doc(db, path));
  },

  /**
   * Broadcasting
   */
  async sendBroadcast(text: string, priority: Broadcast['priority'], expiryHours: number) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    return await addDoc(collection(db, "broadcasts"), {
      text,
      priority,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      active: true
    });
  },

  /**
   * User Management
   */
  async promoteToAdmin(userId: string) {
    return await updateDoc(doc(db, "users", userId), {
      role: 'admin'
    });
  },

  /**
   * Automated Midnight Reset & Global Cleanup Logic (Dhaka UTC+6)
   * Resets stale pump statuses and deletes old chat messages physically.
   * PRO-GRADE: Implements Chunked Batching to handle >500 operations safely.
   */
  async performAutoCleanup() {
    const { getDhakaMidnight, isStale } = await import("../utils/time-utils");
    const resetPoint = getDhakaMidnight();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const stationsSnap = await getDocs(collection(db, "verified_pumps"));
    const chatSnap = await getDocs(collectionGroup(db, "messages"));
    
    let totalOperations = 0;
    let currentBatch = writeBatch(db);
    let currentBatchCount = 0;

    const commitAndReset = async () => {
      if (currentBatchCount > 0) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        currentBatchCount = 0;
      }
    };

    const addOperation = async () => {
      currentBatchCount++;
      totalOperations++;
      if (currentBatchCount >= 500) {
        await commitAndReset();
      }
    };

    // 1. Reset Stale Stations
    for (const d of stationsSnap.docs) {
      const data = d.data() as Station;
      const isExtremelyOld = data.status === 'unknown' && 
                            data.last_updated && 
                            data.last_updated.toDate() < oneWeekAgo;

      if (isStale(data.last_updated) || isExtremelyOld) {
        currentBatch.update(d.ref, {
          status: 'unknown',
          category: isExtremelyOld ? 'secondary' : (data.category || 'primary'),
          social_verify_count: 0,
          user_verification_list: [],
          last_updated: serverTimestamp()
        });
        await addOperation();
      }
    }

    // 2. Clear Daily Chat Messages
    for (const d of chatSnap.docs) {
      currentBatch.delete(d.ref);
      await addOperation();
    }

    // Final commit
    await commitAndReset();

    return { success: true, count: totalOperations };
  },

  /**
   * Scenario A: Ensure Initial Data / Resync with Google Maps
   */
  async ensureInitialData(stationId: string) {
    const stationRef = doc(db, "verified_pumps", stationId);
    const snap = await getDoc(stationRef);
    
    if (snap.exists()) {
      // Skeletal logic for resync (would integrate with GMap API in production)
      return await updateDoc(stationRef, {
        isVerified: true,
        last_updated: serverTimestamp()
      });
    }
  },

  /**
   * Bulk Sync Stations to Areas
   * One-time operation to align entire database with the alert system.
   */
  async syncAllStationsToAreas() {
    const snap = await getDocs(collection(db, "verified_pumps"));
    let batch = writeBatch(db);
    let count = 0;
    let total = 0;

    for (const d of snap.docs) {
      const data = d.data() as Station;
      const area = getNearestArea(data.latitude, data.longitude);
      
      batch.update(d.ref, { area });
      count++;
      total++;

      if (count >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    return { success: true, count: total };
  }
};
