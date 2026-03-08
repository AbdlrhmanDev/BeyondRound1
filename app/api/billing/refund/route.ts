import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, createAdminClient } from '@/integrations/supabase/server';
import { sanitizeError } from '@/lib/securityUtils';
import { checkRateLimit } from '@/lib/rateLimit';
import { emailService } from '@/services/emailService';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    });

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 3 refund requests per hour per user
    const rlRes = checkRateLimit(user.id, 'refund');
    if (rlRes) return rlRes;

    const admin = createAdminClient();

    // Get subscription to find the Stripe customer ID
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id, plan_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found.' }, { status: 400 });
    }

    // ── Find the payment to refund ──────────────────────────────────────────
    // Tier 1: DB invoices table (populated by Supabase Edge Function webhook)
    // Tier 2: Stripe invoices API (subscription billing, webhooks not yet configured)
    // Tier 3: Stripe payment intents (one-time payments — no invoices created)

    let paymentIntentId: string | null = null;
    let amountCents = 0;
    let currency = 'eur';
    let dbInvoiceId: string | null = null;

    const { data: dbInvoice } = await admin
      .from('invoices')
      .select('id, stripe_invoice_id, status')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbInvoice) {
      // Prevent double-refund via DB record
      if (dbInvoice.status === 'refunded') {
        return NextResponse.json({ error: 'This invoice has already been refunded.' }, { status: 400 });
      }
      const stripeInvoice = await stripe.invoices.retrieve(dbInvoice.stripe_invoice_id) as Stripe.Invoice & { payment_intent?: string | Stripe.PaymentIntent | null };
      if (!stripeInvoice.payment_intent) {
        return NextResponse.json({ error: 'No payment found to refund.' }, { status: 400 });
      }
      paymentIntentId = typeof stripeInvoice.payment_intent === 'string'
        ? stripeInvoice.payment_intent
        : stripeInvoice.payment_intent.id;
      amountCents = stripeInvoice.amount_paid ?? 0;
      currency    = stripeInvoice.currency ?? 'eur';
      dbInvoiceId = dbInvoice.id;
    } else {
      // Tier 2: query Stripe directly for paid invoices (subscription payments)
      let stripeInvoicesList: Stripe.ApiList<Stripe.Invoice>;
      try {
        stripeInvoicesList = await stripe.invoices.list({
          customer: sub.stripe_customer_id,
          status:   'paid',
          limit:    1,
        });
      } catch (stripeErr) {
        const msg = stripeErr instanceof Error ? stripeErr.message : '';
        console.error('[api/billing/refund] stripe.invoices.list failed:', msg);
        if (msg.includes('No such customer')) {
          return NextResponse.json(
            { error: 'Billing account not found in Stripe. Please complete a checkout first, then request a refund.' },
            { status: 400 }
          );
        }
        throw stripeErr;
      }

      const latestInvoice = stripeInvoicesList.data[0] as (Stripe.Invoice & { payment_intent?: string | Stripe.PaymentIntent | null }) | undefined;
      if (latestInvoice) {
        if (!latestInvoice.payment_intent) {
          return NextResponse.json({ error: 'No payment found to refund.' }, { status: 400 });
        }
        paymentIntentId = typeof latestInvoice.payment_intent === 'string'
          ? latestInvoice.payment_intent
          : latestInvoice.payment_intent.id;
        amountCents = latestInvoice.amount_paid ?? 0;
        currency    = latestInvoice.currency ?? 'eur';
      } else {
        // Tier 3: no invoices — look for direct payment intents (one-time payments)
        const piList = await stripe.paymentIntents.list({
          customer: sub.stripe_customer_id,
          limit:    10,
        });
        const latestPi = piList.data.find((pi) => pi.status === 'succeeded');
        if (!latestPi) {
          return NextResponse.json({ error: 'No paid invoice found to refund.' }, { status: 400 });
        }
        paymentIntentId = latestPi.id;
        amountCents     = latestPi.amount_received ?? latestPi.amount;
        currency        = latestPi.currency ?? 'eur';
      }
    }

    // Issue the full refund
    const refund = await stripe.refunds.create({ payment_intent: paymentIntentId! });

    if (refund.status !== 'succeeded' && refund.status !== 'pending') {
      return NextResponse.json({ error: 'Refund could not be processed.' }, { status: 400 });
    }

    // Mark invoice as refunded in DB (only if we have a DB record)
    if (dbInvoiceId) {
      await admin
        .from('invoices')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('id', dbInvoiceId);
    }

    // Cancel the subscription in Stripe (refund = full withdrawal)
    if (sub?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      } catch (stripeErr) {
        const msg = stripeErr instanceof Error ? stripeErr.message : '';
        if (!msg.includes('No such subscription')) throw stripeErr;
        // Subscription already gone in Stripe — proceed to DB update
      }
    }

    // Mark subscription as canceled in DB
    await admin
      .from('subscriptions')
      .update({
        status:               'canceled',
        cancel_at_period_end: false,
        canceled_at:          new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // Send refund confirmation email — fire and forget
    const formattedAmount = new Intl.NumberFormat('de-DE', {
      style:    'currency',
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);

    void emailService
      .sendRefundProcessed(user.email!, formattedAmount, sub?.plan_name ?? 'BeyondRounds')
      .catch((err) => console.error('[api/billing/refund] email error:', err));

    return NextResponse.json({
      success:   true,
      refund_id: refund.id,
      amount:    amountCents,
      currency,
    });
  } catch (err) {
    console.error('[api/billing/refund]', err instanceof Error ? err.message : err);
    const { message, status } = sanitizeError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
