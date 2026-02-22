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

    const admin = createAdminClient();
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    let returnUrl = `${appUrl}/settings?tab=billing`;
    try {
      const body = await req.json();
      if (body?.returnUrl) returnUrl = body.returnUrl;
    } catch { /* body is optional */ }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   sub.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/billing/portal]', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
