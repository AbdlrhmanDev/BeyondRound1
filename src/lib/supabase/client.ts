'use client';

// Re-export from integrations to ensure consistent env var handling
import { createClient, getClient, supabase } from '@/integrations/supabase/client';

export { createClient, getClient, supabase };
