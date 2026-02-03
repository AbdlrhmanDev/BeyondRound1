/**
 * Onboarding Service - Handles onboarding data operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export interface OnboardingPreferences {
  user_id: string;
  specialty: string | null;
  specialty_preference?: string | null;
  group_language_preference?: string | null;
  career_stage: string | null;
  activity_level?: string | null;
  interests: string[] | null;
  other_interests: string[] | null;
  sports: string[] | null;
  music_preferences: string[] | null;
  movie_preferences: string[] | null;
  meeting_activities?: string[] | null;
  friendship_type: string[] | null;
  meeting_frequency: string | null;
  social_energy?: string | null;
  conversation_style?: string | null;
  goals?: string[] | null;
  dietary_preferences?: string[] | null;
  life_stage?: string | null;
  ideal_weekend?: string[] | null;
  social_style?: string[] | null;
  culture_interests?: string[] | null;
  lifestyle?: string[] | null;
  availability_slots?: string[] | null;
  completed_at: string | null;
  open_to_business?: boolean | null;
}

export interface PersonalInfo {
  name?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  gender?: string | null;
  birthYear?: string | null;
  genderPreference?: string | null;
  nationality?: string | null;
}

/**
 * Gets onboarding preferences
 */
export const getOnboardingPreferences = async (
  userId: string
): Promise<OnboardingPreferences | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getOnboardingPreferences:", userId);
      return null;
    }

    const { data, error } = await supabase
      .from("onboarding_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching onboarding preferences:", error);
      return null;
    }

    return data as OnboardingPreferences | null;
  } catch (error) {
    console.error("Error fetching onboarding preferences:", error);
    return null;
  }
};

/**
 * Gets public onboarding preferences (limited fields)
 */
export const getPublicPreferences = async (
  userId: string
): Promise<Partial<OnboardingPreferences> | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getPublicPreferences:", userId);
      return null;
    }

    const { data, error } = await supabase
      .from("onboarding_preferences")
      .select("specialty, career_stage, interests, other_interests, friendship_type, sports, music_preferences, movie_preferences, social_style, culture_interests, lifestyle, availability_slots")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching public preferences:", error);
      return null;
    }

    return data as Partial<OnboardingPreferences> | null;
  } catch (error) {
    console.error("Error fetching public preferences:", error);
    return null;
  }
};

/**
 * Marks onboarding as complete
 */
export const markOnboardingComplete = async (userId: string): Promise<boolean> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for markOnboardingComplete:", userId);
      return false;
    }

    const { error } = await supabase
      .from("onboarding_preferences")
      .upsert({
        user_id: userId,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error("Error marking onboarding complete:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking onboarding complete:", error);
    return false;
  }
};

/**
 * Saves onboarding preferences
 */
export const saveOnboardingPreferences = async (
  userId: string,
  preferences: Partial<OnboardingPreferences>
): Promise<boolean> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for saveOnboardingPreferences:", userId);
      return false;
    }

    if (!preferences || Object.keys(preferences).length === 0) {
      console.error("No preferences provided for saveOnboardingPreferences");
      return false;
    }

    const { error } = await supabase
      .from("onboarding_preferences")
      .upsert({
        user_id: userId,
        ...preferences,
        completed_at: preferences.completed_at || new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error("Error saving onboarding preferences:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving onboarding preferences:", error);
    return false;
  }
};

/**
 * Checks if onboarding is completed
 */
export const isOnboardingComplete = async (userId: string): Promise<boolean> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for isOnboardingComplete:", userId);
      return false;
    }

    const { data, error } = await supabase
      .from("onboarding_preferences")
      .select("completed_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking onboarding completion:", error);
      return false;
    }

    return !!data?.completed_at;
  } catch (error) {
    console.error("Error checking onboarding completion:", error);
    return false;
  }
};

/**
 * Saves onboarding data (profile + preferences)
 */
export const saveOnboardingData = async (
  userId: string,
  personalInfo: PersonalInfo,
  preferences: Partial<OnboardingPreferences>
): Promise<{ profileSuccess: boolean; preferencesSuccess: boolean }> => {
  try {
    // Update profile
    const profileUpdate: Record<string, unknown> = {};
    if (personalInfo.name !== undefined) profileUpdate.full_name = personalInfo.name;
    if (personalInfo.country !== undefined) profileUpdate.country = personalInfo.country;
    if (personalInfo.state !== undefined) profileUpdate.state = personalInfo.state;
    if (personalInfo.city !== undefined) profileUpdate.city = personalInfo.city;
    if (personalInfo.neighborhood !== undefined) profileUpdate.neighborhood = personalInfo.neighborhood;
    if (personalInfo.gender !== undefined) profileUpdate.gender = personalInfo.gender;
    if (personalInfo.birthYear !== undefined) {
      profileUpdate.birth_year = personalInfo.birthYear ? parseInt(personalInfo.birthYear) : null;
    }
    if (personalInfo.genderPreference !== undefined) profileUpdate.gender_preference = personalInfo.genderPreference;
    if (personalInfo.nationality !== undefined) profileUpdate.nationality = personalInfo.nationality;

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", userId);

    // Save preferences
    const { error: prefsError } = await supabase
      .from("onboarding_preferences")
      .upsert({
        user_id: userId,
        ...preferences,
        completed_at: preferences.completed_at || new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return {
      profileSuccess: !profileError,
      preferencesSuccess: !prefsError,
    };
  } catch (error) {
    console.error("Error saving onboarding data:", error);
    return {
      profileSuccess: false,
      preferencesSuccess: false,
    };
  }
};
