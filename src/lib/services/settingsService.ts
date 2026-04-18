import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface GlobalSettings {
  showIntelligenceAnalysis: boolean;
  maintenanceMode: boolean;
  allowGuestChat: boolean;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  showIntelligenceAnalysis: true,
  maintenanceMode: false,
  allowGuestChat: false,
};

export const settingsService = {
  /**
   * Fetches the global settings document
   */
  async getSettings(): Promise<GlobalSettings> {
    try {
      const docRef = doc(db, "app_config", "global");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...DEFAULT_SETTINGS, ...docSnap.data() } as GlobalSettings;
      } else {
        // Initialize with defaults if it doesn't exist
        await this.updateSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Updates global settings
   */
  async updateSettings(settings: Partial<GlobalSettings>) {
    const docRef = doc(db, "app_config", "global");
    await setDoc(docRef, settings, { merge: true });
  },

  /**
   * Listen for real-time changes to global settings
   */
  subscribeToSettings(callback: (settings: GlobalSettings) => void) {
    const docRef = doc(db, "app_config", "global");
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ ...DEFAULT_SETTINGS, ...doc.data() } as GlobalSettings);
      } else {
        callback(DEFAULT_SETTINGS);
      }
    });
  }
};
