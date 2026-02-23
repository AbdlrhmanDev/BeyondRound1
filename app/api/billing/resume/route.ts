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
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, cancel_at_period_end, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found.' }, { status: 400 });
    }
    if (!sub.cancel_at_period_end) {
      return NextResponse.json({ error: 'Subscription is not pending cancellation.' }, { status: 400 });
    }
    if (sub.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription has already ended. Please subscribe again.' },
        { status: 400 }
      );
    }

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    await admin
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        canceled_at:          null,
        updated_at:           new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, message: 'Subscription resumed successfully.' });
  } catch (err) {
    console.error('[api/billing/resume]', err instanceof Error ? err.message : err);
    const { message, status } = sanitizeError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
