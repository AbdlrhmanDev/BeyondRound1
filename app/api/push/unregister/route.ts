import { NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

// POST /api/push/unregister
// Body: { token: string }  — the raw JSON string of the PushSubscription
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await req.json() as { token: string };
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const { error } = await supabase.rpc('unregister_push_subscription', {
      p_user_id:              user.id,
      p_token_or_subscription: token,
    });

    if (error) {
      console.error('[push/unregister] RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[push/unregister] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
