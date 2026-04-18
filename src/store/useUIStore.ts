import { create } from "zustand";

interface UIState {
  isSearchOpen: boolean;
  isLiveListOpen: boolean;
  isAlertSettingsOpen: boolean;
  setSearchOpen: (isOpen: boolean) => void;
  setLiveListOpen: (isOpen: boolean) => void;
  setAlertSettingsOpen: (isOpen: boolean) => void;
  toggleSearch: () => void;
  toggleLiveList: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  isLiveListOpen: false,
  isAlertSettingsOpen: false,
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  setLiveListOpen: (isOpen) => set({ isLiveListOpen: isOpen }),
  setAlertSettingsOpen: (isOpen) => set({ isAlertSettingsOpen: isOpen }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  toggleLiveList: () => set((state) => ({ isLiveListOpen: !state.isLiveListOpen })),
}));

