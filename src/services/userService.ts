/**
 * User Service - Handles user-related operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserStatus {
  status: string;
  ban_reason: string | null;
}

/**
 * Checks if a user is banned or suspended
 */
export const checkUserStatus = async (userId: string): Promise<UserStatus | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for checkUserStatus:", userId);
      return null;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("status, ban_reason")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking user status:", error);
      return null;
    }

    return profile || null;
  } catch (error) {
    console.error("Error checking user status:", error);
    return null;
  }
};

/**
 * Checks if user is banned or suspended
 */
export const isUserBanned = async (userId: string): Promise<boolean> => {
  // Input validation
  if (!userId?.trim()) {
    console.error("Invalid userId for isUserBanned:", userId);
    return false;
  }

  const status = await checkUserStatus(userId);
  return !!(status && (status.status === "banned" || status.status === "suspended"));
};
