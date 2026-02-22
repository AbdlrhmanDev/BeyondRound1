import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, createAdminClient } from '@/integrations/supabase/server';

async function getOrCreateCustomer(
  stripe: Stripe,
  userId: string,
  userEmail: string,
  userName?: string | null
): Promise<string> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (data?.stripe_customer_id) return data.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: userEmail,
    name: userName ?? undefined,
    metadata: { userId },
  });

  await admin.from('subscriptions').upsert(
    {
      user_id:            userId,
      stripe_customer_id: customer.id,
      status:             'inactive',
      updated_at:         new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  return customer.id;
}

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });

    const ONE_TIME_PRICE_IDS = new Set([
      process.env.STRIPE_PRICE_ID_ONE_TIME ?? '',
    ].filter(Boolean));

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, successUrl, cancelUrl } = await req.json();
    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const customerId = await getOrCreateCustomer(stripe, user.id, user.email!, profile?.full_name);

    const isOneTime = ONE_TIME_PRICE_IDS.has(priceId);
    if (!isOneTime) {
      const { data: sub } = await admin
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (sub?.status === 'active' || sub?.status === 'trialing') {
        return NextResponse.json(
          { error: 'You already have an active subscription. Use the switch plan option instead.' },
          { status: 400 }
        );
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const mode: Stripe.Checkout.SessionCreateParams.Mode = isOneTime ? 'payment' : 'subscription';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer:    customerId,
      mode,
      line_items:  [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${appUrl}/settings?tab=billing&success=true`,
      cancel_url:  cancelUrl  ?? `${appUrl}/settings?tab=billing&canceled=true`,
      metadata:    { userId: user.id },
      allow_promotion_codes: true,
    };

    if (mode === 'subscription') {
      sessionParams.subscription_data = { metadata: { userId: user.id } };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/billing/checkout]', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
