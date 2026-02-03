'use client';

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSettings } from "@/services/settingsService";

/**
 * Applies user's dark_mode setting to document when logged in (e.g. after refresh).
 */
export function ThemeSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    getSettings(user.id).then((settings) => {
      if (settings?.dark_mode != null) {
        document.documentElement.classList.toggle("dark", settings.dark_mode);
      }
    });
  }, [user?.id]);

  return null;
}
