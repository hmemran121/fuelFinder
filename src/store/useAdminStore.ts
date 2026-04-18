import { create } from "zustand";
import { adminService, SystemStats, ActivityLog, Broadcast } from "@/lib/services/adminService";
import { onSnapshot, collection, query, orderBy, limit, where, Timestamp, collectionGroup } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Station } from "@/types";

interface AdminState {
  stats: SystemStats | null;
  logs: ActivityLog[];
  broadcasts: Broadcast[];
  stations: Station[];
  loading: boolean;
  
  fetchInitialData: () => Promise<void>;
  subscribeToLiveData: () => () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  stats: null,
  logs: [],
  broadcasts: [],
  stations: [],
  loading: true,

  fetchInitialData: async () => {
    set({ loading: true });
    try {
      const stats = await adminService.getSystemStats();
      const logs = await adminService.getRecentLogs();
      set({ stats, logs, loading: false });
    } catch (error) {
      console.error("Admin storage fetch error:", error);
      set({ loading: false });
    }
  },

  subscribeToLiveData: () => {
    // 1. Logs Subscription (Aggregated Community Telemetry - Admin Only)
    const logsQuery = query(
      collectionGroup(db, "logs"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const unsubscribeLogs = onSnapshot(logsQuery, 
      (snap) => {
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityLog[];
        set({ logs });
      },
      (err) => console.warn("Log sync restricted (Normal for non-admins)")
    );

    // 2. Active Broadcasts Subscription (Public)
    const broadcastQuery = query(
      collection(db, "broadcasts"),
      where("active", "==", true)
    );
    const unsubscribeBroadcasts = onSnapshot(broadcastQuery, 
      (snap) => {
        const broadcasts = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() })) as Broadcast[];
        
        // Dynamic Sort: Avoid Firestore Index requirement
        broadcasts.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        set({ broadcasts });
      },
      (err) => console.error("Broadcast sync error:", err)
    );

    // 3. Stations Subscription (Public)
    const stationsQuery = query(collection(db, "verified_pumps"));
    const unsubscribeStations = onSnapshot(stationsQuery, 
      (snap) => {
        const stations = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Station[];
        set({ stations });
      },
      (err) => console.error("Station sync error:", err)
    );

    return () => {
      unsubscribeLogs();
      unsubscribeBroadcasts();
      unsubscribeStations();
    };
  }
}));
