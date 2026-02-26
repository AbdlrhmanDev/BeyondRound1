import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _adminClient: SupabaseClient<Database> | null = null;

/**
 * Supabase Admin Client (lazy singleton)
 * Uses the Service Role key — bypasses all RLS.
 * ONLY use on server side (API routes / server actions).
 *
 * Add SUPABASE_SERVICE_ROLE_KEY to your .env to enable this.
 * Find it at: Supabase Dashboard → Project Settings → API → service_role key
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (_adminClient) return _adminClient;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase Admin credentials.\n' +
      'Add SUPABASE_SERVICE_ROLE_KEY to your .env file.\n' +
      'Find it at: Supabase Dashboard → Project Settings → API → service_role key'
    );
  }

  _adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _adminClient;
}

// Named export kept for convenience
export const supabaseAdmin = {
  get auth() { return getSupabaseAdmin().auth; },
};
