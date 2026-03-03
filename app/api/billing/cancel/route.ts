import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, createAdminClient } from '@/integrations/supabase/server';
import { sanitizeError } from '@/lib/securityUtils';

export async function POST() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: sub, error: subErr } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subErr || !sub?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    let cancelAt: string | null = null;

    try {
      const canceled = await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      cancelAt = canceled.cancel_at
        ? new Date(canceled.cancel_at * 1000).toISOString()
        : null;
    } catch (stripeErr) {
      // If the subscription no longer exists in Stripe (e.g. stale test data),
      // treat it as already canceled — mark the DB row and let the UI update.
      const msg = stripeErr instanceof Error ? stripeErr.message : '';
      if (!msg.includes('No such subscription')) throw stripeErr;
      console.warn('[api/billing/cancel] subscription not found in Stripe — marking canceled in DB:', sub.stripe_subscription_id);
    }

    await admin
      .from('subscriptions')
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Subscription will cancel at the end of the billing period',
      cancel_at: cancelAt,
    });
  } catch (err) {
    console.error('[api/billing/cancel]', err instanceof Error ? err.message : err);
    const { message, status } = sanitizeError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
