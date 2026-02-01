/**
 * Settings Service - Handles user settings (notifications, privacy, appearance)
 */

import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  match_notifications: boolean;
  event_notifications: boolean;
  profile_visible: boolean;
  dark_mode: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  email_notifications: true,
  push_notifications: true,
  match_notifications: true,
  event_notifications: true,
  profile_visible: true,
  dark_mode: false,
};

/**
 * Get user settings. Returns defaults if no row exists.
 */
export const getSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    if (!userId?.trim()) return null;

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user settings:", error);
      return null;
    }

    if (data) return data as UserSettings;

    // No row: return defaults (caller can upsert on first save)
    return {
      id: "",
      user_id: userId,
      ...DEFAULT_SETTINGS,
    } as UserSettings;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }
};

export type UserSettingsUpdate = Partial<
  Pick<
    UserSettings,
    | "email_notifications"
    | "push_notifications"
    | "match_notifications"
    | "event_notifications"
    | "profile_visible"
    | "dark_mode"
  >
>;

/**
 * Update user settings. Upserts (insert or update) by user_id.
 */
export const updateSettings = async (
  userId: string,
  updates: UserSettingsUpdate
): Promise<UserSettings | null> => {
  try {
    if (!userId?.trim() || !updates || Object.keys(updates).length === 0) return null;

    const { data: existing } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating user settings:", error);
        return null;
      }
      return data as UserSettings;
    }

    const { data, error } = await supabase
      .from("user_settings")
      .insert({ user_id: userId, ...DEFAULT_SETTINGS, ...updates })
      .select()
      .single();

    if (error) {
      console.error("Error inserting user settings:", error);
      return null;
    }
    return data as UserSettings;
  } catch (error) {
    console.error("Error updating user settings:", error);
    return null;
  }
};
