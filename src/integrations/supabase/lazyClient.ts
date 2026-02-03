'use client';

/**
 * Lazy-loads Supabase client.
 * For Next.js, this is simpler since we use the SSR client.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let clientPromise: Promise<SupabaseClient<Database>> | null = null;

export function getSupabase(): Promise<SupabaseClient<Database>> {
  if (!clientPromise) {
    clientPromise = import("./client").then((m) => m.createClient());
  }
  return clientPromise;
}
