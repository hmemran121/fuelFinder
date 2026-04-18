"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { settingsService } from "@/lib/services/settingsService";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, fetchProfile, setLoading } = useAuthStore();
  const { setSettings } = useSettingsStore();

  useEffect(() => {
    // 1. Auth Subscription
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        useAuthStore.getState().setProfile(null);
      }
      setLoading(false);
    });

    // 2. Global Settings Subscription
    const unsubscribeSettings = settingsService.subscribeToSettings((newSettings) => {
      setSettings(newSettings);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, [setUser, fetchProfile, setLoading, setSettings]);

  return <>{children}</>;
}
