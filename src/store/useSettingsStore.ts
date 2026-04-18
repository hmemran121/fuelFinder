import { create } from "zustand";
import { GlobalSettings, settingsService } from "@/lib/services/settingsService";

interface SettingsState {
  settings: GlobalSettings;
  loading: boolean;
  setSettings: (settings: GlobalSettings) => void;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: keyof GlobalSettings, value: any) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    showIntelligenceAnalysis: true,
    maintenanceMode: false,
    allowGuestChat: false,
  },
  loading: true,
  setSettings: (settings) => set({ settings, loading: false }),
  fetchSettings: async () => {
    const settings = await settingsService.getSettings();
    set({ settings, loading: false });
  },
  updateSetting: async (key, value) => {
    const currentSettings = get().settings;
    const newSettings = { ...currentSettings, [key]: value };
    // Optimistic update
    set({ settings: newSettings });
    try {
      await settingsService.updateSettings({ [key]: value });
    } catch (error) {
      // Revert on error
      set({ settings: currentSettings });
      console.error("Failed to update setting:", error);
    }
  },
}));
