import { NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

// POST /api/push/register
// Body: { subscription: PushSubscription JSON, platform: 'web' | 'ios' | 'android' }
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscription, platform = 'web' } = body as {
      subscription: PushSubscriptionJSON;
      platform?: 'web' | 'ios' | 'android';
    };

    if (!subscription || !platform) {
      return NextResponse.json({ error: 'subscription and platform are required' }, { status: 400 });
    }

    if (!['web', 'ios', 'android'].includes(platform)) {
      return NextResponse.json({ error: 'platform must be web, ios, or android' }, { status: 400 });
    }

    const tokenOrJson =
      typeof subscription === 'string' ? subscription : JSON.stringify(subscription);

    // Upsert via SECURITY DEFINER RPC to bypass RLS
    const { data: id, error } = await supabase.rpc('register_push_subscription', {
      p_user_id:              user.id,
      p_platform:             platform,
      p_token_or_subscription: tokenOrJson,
    });

    if (error) {
      console.error('[push/register] RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[push/register] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
