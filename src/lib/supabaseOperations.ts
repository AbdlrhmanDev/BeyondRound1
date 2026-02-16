// BeyondRounds - Safe Supabase Operations
// Updated patterns to work with fixed RLS policies

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// ============================================================================
// PROFILE OPERATIONS
// ============================================================================

/**
 * Update user profile with proper error handling
 * Uses specific column selection to avoid PGRST116 errors
 */
export async function updateUserProfile(
  supabase: ReturnType<typeof createClient>,
  profileData: Partial<Database['public']['Tables']['profiles']['Row']>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Use specific columns to avoid "Cannot coerce result to single JSON object"
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData as never)
      .eq('user_id', user.id)
      .select('id, user_id, full_name, avatar_url, city, gender, date_of_birth, status');

    if (error) {
      if (error.code === 'PGRST116' || (error as { status?: number }).status === 406) {
        console.error('RLS policy is blocking this update:', error);
        throw new Error('Permission denied: Unable to update profile');
      }
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Profile update returned no data - RLS may be blocking');
    }

    return { data: data[0], error: null };
  } catch (error) {
    console.error('Profile update error:', error);
    return { data: null, error };
  }
}

/**
 * Fetch user's own profile
 */
export async function getUserProfile(
  supabase: ReturnType<typeof createClient>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - profile may not exist yet
        return { data: null, error: 'Profile not found' };
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { data: null, error };
  }
}

// ============================================================================
// ONBOARDING PREFERENCES OPERATIONS
// ============================================================================

/**
 * Save onboarding preferences with proper user validation
 * Ensures user exists in auth.users before attempting insert
 */
export async function saveOnboardingPreferences(
  supabase: ReturnType<typeof createClient>,
  preferences: Partial<Database['public']['Tables']['onboarding_preferences']['Row']>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Wait a moment if this is right after signup (triggers may need time)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Refresh session to ensure auth state is current
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('Session refresh warning:', refreshError);
    }

    // Now safely insert/update preferences
    const { data, error } = await supabase
      .from('onboarding_preferences')
      .upsert(
        {
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        } as never,
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) {
      if (error.code === '23503') {
        console.error('Foreign key error: User does not exist in auth.users');
        throw new Error('User record not found. Please try logging in again.');
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error saving onboarding preferences:', error);
    return { data: null, error };
  }
}

/**
 * Fetch user's onboarding preferences
 */
export async function getOnboardingPreferences(
  supabase: ReturnType<typeof createClient>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('onboarding_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error?.code === 'PGRST116') {
      // Not found - return empty preferences
      return { data: null, error: null };
    }

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching onboarding preferences:', error);
    return { data: null, error };
  }
}

// ============================================================================
// GROUP MEMBERS OPERATIONS
// ============================================================================

/**
 * Get user's group memberships
 * Works with fixed non-recursive RLS policies
 */
export async function getUserGroupMemberships(
  supabase: ReturnType<typeof createClient>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Simple query - RLS policy handles filtering
    const { data, error } = await supabase
      .from('group_members')
      .select('id, group_id, joined_at')
      .eq('user_id', user.id);

    if (error) {
      if (error.code === '42P17') {
        console.error('RLS infinite recursion detected - database configuration error');
        throw new Error('Database configuration error. Please contact support.');
      }
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return { data: [], error };
  }
}

/**
 * Get all groups the user is a member of (with group details)
 */
export async function getUserGroupsWithDetails(
  supabase: ReturnType<typeof createClient>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('group_members')
      .select(`
        id,
        group_id,
        joined_at,
        match_groups!inner (
          id,
          name,
          group_type,
          status,
          match_week,
          created_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      if (error.code === '42P17') {
        throw new Error('Database configuration error with group policies');
      }
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user groups with details:', error);
    return { data: [], error };
  }
}

/**
 * Join a group
 */
export async function joinGroup(
  supabase: ReturnType<typeof createClient>,
  groupId: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('group_members')
      .insert({
        user_id: user.id,
        group_id: groupId,
        joined_at: new Date().toISOString()
      } as never)
      .select('*')
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error joining group:', error);
    return { data: null, error };
  }
}

/**
 * Leave a group
 */
export async function leaveGroup(
  supabase: ReturnType<typeof createClient>,
  groupId: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error leaving group:', error);
    return { error };
  }
}

// ============================================================================
// SIGNUP AND ONBOARDING FLOW
// ============================================================================

/**
 * Complete signup and initial onboarding
 * Handles proper sequencing to avoid foreign key issues
 */
export async function signupAndOnboard(
  supabase: ReturnType<typeof createClient>,
  email: string,
  password: string,
  profileData: Partial<Database['public']['Tables']['profiles']['Row']>,
  preferences: Partial<Database['public']['Tables']['onboarding_preferences']['Row']>
) {
  try {
    // Step 1: Sign up
    const { data: { user }, error: signupError } =
      await supabase.auth.signUp({ email, password });

    if (signupError) throw signupError;
    if (!user) throw new Error('Signup failed - no user returned');

    // Step 2: Wait for auth.users to be ready
    // Triggers should auto-create profile and preferences, but we can also do it manually
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Update profile with additional data
    if (Object.keys(profileData).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData as never)
        .eq('user_id', user.id);

      if (profileError) {
        console.warn('Profile update warning:', profileError);
        // Don't fail signup if profile update fails
      }
    }

    // Step 4: Save preferences (upsert in case trigger didn't create row)
    const { error: prefError } = await supabase
      .from('onboarding_preferences')
      .upsert(
        { user_id: user.id, ...preferences, updated_at: new Date().toISOString() } as never,
        { onConflict: 'user_id' }
      );

    if (prefError) {
      console.error('Preferences save error:', prefError);
      throw prefError;
    }

    return {
      user,
      error: null,
      message: 'Signup successful! Check your email to confirm.'
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      user: null,
      error,
      message: 'Signup failed. Please try again.'
    };
  }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error occurred';

  const err = error as { code?: string; status?: number; message?: string };

  // Handle Supabase PostgreSQL errors
  if (err.code === '42P17') {
    return 'Database configuration error. Please contact support.';
  }
  if (err.code === '23503') {
    return 'Data validation error. Please ensure you are logged in.';
  }
  if (err.code === 'PGRST116' || err.status === 406) {
    return 'Permission denied. You do not have access to this resource.';
  }
  if (err.message) {
    return err.message;
  }

  return 'An unexpected error occurred';
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check if database RLS policies are working correctly
 */
export async function checkDatabaseHealth(
  supabase: ReturnType<typeof createClient>
) {
  const results = {
    authenticated: false,
    profileAccessible: false,
    groupMembersAccessible: false,
    preferencesAccessible: false,
    errors: [] as string[]
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      results.errors.push('User not authenticated');
      return results;
    }

    results.authenticated = true;

    // Test profile access
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profileError || profileError.code !== 'PGRST116') {
        results.profileAccessible = true;
      }
    } catch (e) {
      results.errors.push(`Profile access error: ${e}`);
    }

    // Test group_members access
    try {
      const { error: groupError } = await supabase
        .from('group_members')
        .select('id')
        .eq('user_id', user.id);

      if (!groupError) {
        results.groupMembersAccessible = true;
      }
    } catch (e) {
      results.errors.push(`Group members access error: ${e}`);
    }

    // Test preferences access
    try {
      const { error: prefError } = await supabase
        .from('onboarding_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!prefError || prefError.code !== 'PGRST116') {
        results.preferencesAccessible = true;
      }
    } catch (e) {
      results.errors.push(`Preferences access error: ${e}`);
    }

  } catch (error) {
    results.errors.push(`Health check error: ${error}`);
  }

  return results;
}
