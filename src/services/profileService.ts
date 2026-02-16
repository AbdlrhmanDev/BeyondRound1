/**
 * Profile Service - Handles profile-related operations
 * Refactored to use centralized utilities for validation, logging, and error handling
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { validateUserId } from '@/lib/validation';
import { tryCatch, normalizeError, ErrorCodes, AppError } from '@/lib/errors';

// Scoped logger for this service
const log = logger.scope('ProfileService');

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
  date_of_birth: string | null;
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
  const validUserId = validateUserId(userId, 'getProfile');
  if (!validUserId) return null;

  const [result, error] = await tryCatch(async () => {
    const { data, error: dbError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", validUserId)
      .maybeSingle();

    if (dbError) {
      throw normalizeError(dbError, 'getProfile');
    }

    return data as unknown as Profile | null;
  }, 'getProfile');

  if (error) {
    log.error('Failed to fetch profile', error, { userId: validUserId });
    return null;
  }

  return result;
};

/**
 * Gets public profile (limited fields) by user ID
 */
export const getPublicProfile = async (userId: string): Promise<PublicProfile | null> => {
  const validUserId = validateUserId(userId, 'getPublicProfile');
  if (!validUserId) return null;

  const [result, error] = await tryCatch(async () => {
    const { data, error: dbError } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, city, neighborhood, gender")
      .eq("user_id", validUserId)
      .maybeSingle();

    if (dbError) {
      throw normalizeError(dbError, 'getPublicProfile');
    }

    return data as PublicProfile | null;
  }, 'getPublicProfile');

  if (error) {
    log.error('Failed to fetch public profile', error, { userId: validUserId });
    return null;
  }

  return result;
};

/**
 * Updates user profile
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> => {
  const validUserId = validateUserId(userId, 'updateProfile');
  if (!validUserId) return null;

  if (!updates || Object.keys(updates).length === 0) {
    log.warn('No updates provided for updateProfile', { userId: validUserId });
    return null;
  }

  const [result, error] = await tryCatch(async () => {
    // Try update first
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", validUserId)
      .select()
      .maybeSingle();

    if (updateError) {
      throw normalizeError(updateError, 'updateProfile');
    }

    // If no rows updated, upsert to create profile
    if (!data) {
      log.debug('Profile not found, attempting upsert', { userId: validUserId });

      const { data: upsertData, error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          { user_id: validUserId, ...updates },
          { onConflict: "user_id", ignoreDuplicates: false }
        )
        .select()
        .maybeSingle();

      if (upsertError) {
        throw normalizeError(upsertError, 'updateProfile.upsert');
      }

      return upsertData as unknown as Profile | null;
    }

    return data as unknown as Profile;
  }, 'updateProfile');

  if (error) {
    log.error('Failed to update profile', error, { userId: validUserId });
    return null;
  }

  log.info('Profile updated successfully', { userId: validUserId });
  return result;
};

/**
 * Gets user's city
 */
export const getUserCity = async (userId: string): Promise<string | null> => {
  const validUserId = validateUserId(userId, 'getUserCity');
  if (!validUserId) return null;

  const [result, error] = await tryCatch(async () => {
    const { data, error: dbError } = await supabase
      .from("profiles")
      .select("city")
      .eq("user_id", validUserId)
      .maybeSingle();

    if (dbError) {
      throw normalizeError(dbError, 'getUserCity');
    }

    return data?.city || null;
  }, 'getUserCity');

  if (error) {
    log.error('Failed to fetch user city', error, { userId: validUserId });
    return null;
  }

  return result;
};
