import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, createAdminClient } from '@/integrations/supabase/server';
import { validateReturnUrl, sanitizeError } from '@/lib/securityUtils';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 portal sessions per minute per user
    const rlRes = checkRateLimit(user.id, 'billing');
    if (rlRes) return rlRes;

    const admin = createAdminClient();
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Static portal link — used as fallback when no customer exists or
    // when the customer ID is stale (e.g. test-mode data mismatch).
    const staticPortalUrl = process.env.STRIPE_PORTAL_URL;

    if (!sub?.stripe_customer_id) {
      if (staticPortalUrl) {
        return NextResponse.json({ url: staticPortalUrl });
      }
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const defaultReturn = `${appUrl}/settings?tab=billing`;
    // Validate returnUrl against allowlist — prevents open redirect attacks
    let returnUrl = defaultReturn;
    try {
      const body = await req.json();
      returnUrl = validateReturnUrl(body?.returnUrl, defaultReturn);
    } catch { /* body is optional */ }

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer:   sub.stripe_customer_id,
        return_url: returnUrl,
      });
      return NextResponse.json({ url: portalSession.url });
    } catch (stripeErr) {
      // Customer doesn't exist in Stripe (e.g. stale test data) — fall back to
      // the static portal link so the user can still manage their billing.
      const msg = stripeErr instanceof Error ? stripeErr.message : '';
      if (staticPortalUrl && (msg.includes('No such customer') || msg.includes('No portal configuration'))) {
        console.warn('[api/billing/portal] falling back to static portal link:', msg);
        return NextResponse.json({ url: staticPortalUrl });
      }
      throw stripeErr;
    }
  } catch (err) {
    console.error('[api/billing/portal]', err instanceof Error ? err.message : err);
    const { message, status } = sanitizeError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
