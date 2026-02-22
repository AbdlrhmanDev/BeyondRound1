import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, createAdminClient } from '@/integrations/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-01-28.clover',
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPriceId } = await req.json();
    if (!newPriceId) {
      return NextResponse.json({ error: 'newPriceId is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_subscription_item_id, stripe_price_id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub?.stripe_subscription_id || !sub?.stripe_subscription_item_id) {
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 400 });
    }
    if (!['active', 'trialing'].includes(sub.status ?? '')) {
      return NextResponse.json(
        { error: `Cannot switch plan: subscription is ${sub.status}.` },
        { status: 400 }
      );
    }
    if (sub.stripe_price_id === newPriceId) {
      return NextResponse.json({ error: 'You are already on this plan.' }, { status: 400 });
    }

    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items: [{ id: sub.stripe_subscription_item_id, price: newPriceId }],
      proration_behavior: 'create_prorations',
    });

    const newItem     = updated.items.data[0];
    const newPriceObj = newItem?.price;
    const intervalCount = newPriceObj?.recurring?.interval_count ?? 1;
    const interval      = newPriceObj?.recurring?.interval ?? null;
    const intervalLabel = interval
      ? intervalCount > 1 ? `${intervalCount}_${interval}s` : interval
      : null;

    await admin
      .from('subscriptions')
      .update({
        stripe_price_id:             newPriceId,
        stripe_subscription_item_id: newItem?.id ?? sub.stripe_subscription_item_id,
        interval:                    intervalLabel,
        current_period_end:          updated.current_period_end
          ? new Date(updated.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, message: 'Plan switched successfully.' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/billing/switch]', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
