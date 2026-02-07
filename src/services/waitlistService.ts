/**
 * Waitlist Service - Handles waitlist signups for pre-launch
 */

import { supabase } from '@/integrations/supabase/client';

export interface WaitlistSubmission {
  email: string;
  city?: string;
  medicalSpecialty?: string;
}

/**
 * Submits email to waitlist
 */
export const joinWaitlist = async (
  data: WaitlistSubmission
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Input validation
    if (!data.email?.trim()) {
      return { success: false, error: 'Email is required' };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Insert into waitlist table
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { error } = await (supabase
      .from('waitlist' as any)
      .insert({
        email: data.email.trim().toLowerCase(),
        city: data.city?.trim() || null,
        medical_specialty: data.medicalSpecialty?.trim() || null,
      }) as any);

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === '23505') {
        return { success: false, error: 'This email is already on the waitlist' };
      }
      console.error('Error joining waitlist:', error);
      return {
        success: false,
        error: 'Failed to join waitlist. Please try again later.'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error joining waitlist:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    };
  }
};

/**
 * Gets waitlist count (public)
 */
export const getWaitlistCount = async (): Promise<number> => {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return 500;
    }

    const { data, error } = await (supabase.rpc('get_waitlist_count' as any) as any);

    if (error) {
      console.error('Error getting waitlist count:', error);
      return 500; // Default fallback number
    }

    // Ensure data is a number
    const count = typeof data === 'number' ? data : 500;
    return count;
  } catch (error) {
    console.error('Error getting waitlist count:', error);
    return 500; // Default fallback number
  }
};
