/**
 * Match Details Service - Handles detailed match analysis
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';
import { MatchGroup, MatchDetails } from '@/types/match';
import { calculateMatchDetails } from '@/utils/matchCalculations';

/**
 * Fetches detailed match analysis for a group
 */
export const fetchMatchDetails = async (
  userId: string,
  group: MatchGroup
): Promise<MatchDetails> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      throw new Error("Invalid userId provided");
    }

    if (!group || !group.id) {
      throw new Error("Invalid group provided");
    }

    // Check if group has members
    if (!group.members || group.members.length === 0) {
      throw new Error("Group has no members");
    }

    // Fetch user's preferences and profile in parallel
    const [prefsRes, profileRes] = await Promise.allSettled([
      supabase
        .from("onboarding_preferences")
        .select("specialty, sports, social_style, culture_interests, lifestyle, availability_slots")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("city, neighborhood")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    // Handle preferences result
    let effectivePrefs: {
      specialty: string | null;
      sports: string[];
      social_style: string[];
      culture_interests: string[];
      lifestyle: string[];
      availability_slots: string[];
    } = {
      specialty: null,
      sports: [],
      social_style: [],
      culture_interests: [],
      lifestyle: [],
      availability_slots: [],
    };

    if (prefsRes.status === "fulfilled" && !prefsRes.value.error && prefsRes.value.data) {
      effectivePrefs = {
        specialty: prefsRes.value.data.specialty || null,
        sports: prefsRes.value.data.sports || [],
        social_style: prefsRes.value.data.social_style || [],
        culture_interests: prefsRes.value.data.culture_interests || [],
        lifestyle: prefsRes.value.data.lifestyle || [],
        availability_slots: prefsRes.value.data.availability_slots || [],
      };
    } else {
      if (prefsRes.status === "rejected") {
        console.warn("Error fetching user preferences, using defaults:", prefsRes.reason);
      } else if (prefsRes.status === "fulfilled" && prefsRes.value.error) {
        console.warn("Error fetching user preferences, using defaults:", prefsRes.value.error);
      }
    }

    // Handle profile result
    let userProfile: { city: string | null; neighborhood: string | null } = { city: null, neighborhood: null };

    if (profileRes.status === "fulfilled" && !profileRes.value.error && profileRes.value.data) {
      userProfile = {
        city: profileRes.value.data.city || null,
        neighborhood: profileRes.value.data.neighborhood || null,
      };
    } else {
      if (profileRes.status === "rejected") {
        console.warn("Error fetching user profile, using defaults:", profileRes.reason);
      } else if (profileRes.status === "fulfilled" && profileRes.value.error) {
        console.warn("Error fetching user profile, using defaults:", profileRes.value.error);
      }
    }

    // Calculate match details using business logic utility
    return calculateMatchDetails(
      effectivePrefs,
      userProfile,
      group.members
    );
  } catch (error) {
    console.error("Error fetching match details:", error);
    throw error;
  }
};
