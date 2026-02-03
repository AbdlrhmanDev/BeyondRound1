'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Support both NEXT_PUBLIC_ and legacy VITE_ env vars; trim whitespace
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ''
).trim();

const SUPABASE_ANON_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

const PLACEHOLDERS = ['your-supabase-project-url', 'your-supabase-anon-key', ''];

if (!SUPABASE_URL || PLACEHOLDERS.includes(SUPABASE_URL)) {
  throw new Error(
    'Missing or invalid NEXT_PUBLIC_SUPABASE_URL. ' +
    'Set it in .env.local (e.g. NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co). ' +
    'Note: .env.local overrides .env — remove placeholder values.'
  );
}

if (!SUPABASE_ANON_KEY || PLACEHOLDERS.includes(SUPABASE_ANON_KEY)) {
  throw new Error(
    'Missing or invalid NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Set it in .env.local. Also accepts NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
  );
}

// Create a singleton browser client (cast to SupabaseClient<Database> for correct typings)
let browserClient: SupabaseClient<Database> | null = null;

export function createClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY) as unknown as SupabaseClient<Database>;
  }
  return browserClient;
}

// Legacy export for backward compatibility
export const supabase = typeof window !== 'undefined' ? createClient() : null;

// Alias for use in hooks
export const getClient = createClient;
