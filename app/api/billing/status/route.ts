import { NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

/**
 * GET /api/billing/status
 * Returns the current subscription row for the authenticated user.
 * Used as a server-side alternative to the client hook (e.g., SSR, RSC).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscription: data ?? null });
  } catch (err) {
    console.error('[api/billing/status]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
