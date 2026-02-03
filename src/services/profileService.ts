/**
 * Profile Service - Handles profile-related operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  license_url?: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  languages?: string[] | null;
  gender: string | null;
  birth_year: number | null;
  gender_preference: string | null;
  nationality: string | null;
  status?: string;
  ban_reason?: string | null;
}

export interface PublicProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  neighborhood: string | null;
  gender: string | null;
}

/**
 * Gets user profile by user ID
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getProfile:", userId);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as unknown as Profile | null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};

/**
 * Gets public profile (limited fields) by user ID
 */
export const getPublicProfile = async (userId: string): Promise<PublicProfile | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getPublicProfile:", userId);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, city, neighborhood, gender")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching public profile:", error);
      return null;
    }

    return data as PublicProfile | null;
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return null;
  }
};

/**
 * Updates user profile
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for updateProfile:", userId);
      return null;
    }

    if (!updates || Object.keys(updates).length === 0) {
      console.error("No updates provided for updateProfile");
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating profile:", error);
      return null;
    }

    // If no rows updated (profile may not exist), try upsert to create it
    if (!data) {
      const { data: upsertData, error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          { user_id: userId, ...updates },
          { onConflict: "user_id", ignoreDuplicates: false }
        )
        .select()
        .maybeSingle();

      if (upsertError) {
        console.error("Error upserting profile:", upsertError);
        return null;
      }
      return upsertData as unknown as Profile | null;
    }

    return data as unknown as Profile;
  } catch (error) {
    console.error("Error updating profile:", error);
    return null;
  }
};

/**
 * Gets user's city
 */
export const getUserCity = async (userId: string): Promise<string | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getUserCity:", userId);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("city")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user city:", error);
      return null;
    }

    return data?.city || null;
  } catch (error) {
    console.error("Error fetching user city:", error);
    return null;
  }
};
