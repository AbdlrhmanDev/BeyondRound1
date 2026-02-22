// @ts-nocheck — Deno Edge Function: processed by Deno runtime, not Node/tsc
// Supabase Edge Function: stripe-webhook
// Handles all Stripe billing events and keeps Supabase DB in sync.
//
// Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   SUPABASE_URL            (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY (auto-injected)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

// ── Plan nickname map (price_id → human name) ─────────────────────────────────
// Keep in sync with your Stripe price nicknames / product names.
const PLAN_NAMES: Record<string, string> = {
  [Deno.env.get("STRIPE_PRICE_ID_ONE_TIME")    ?? ""]: "One-Time Match",
  [Deno.env.get("STRIPE_PRICE_ID_MONTHLY")     ?? ""]: "Monthly Membership",
  [Deno.env.get("STRIPE_PRICE_ID_THREE_MONTH") ?? ""]: "3-Month Membership",
  [Deno.env.get("STRIPE_PRICE_ID_SIX_MONTH")   ?? ""]: "6-Month Membership",
};

// ── Init ──────────────────────────────────────────────────────────────────────
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve Supabase user_id from a Stripe customer_id.
 *  Prefers metadata.userId set at customer creation time (O(1)).
 *  Falls back to subscriptions table lookup.
 */
async function getUserId(customerId: string, metadataUserId?: string | null): Promise<string | null> {
  if (metadataUserId) return metadataUserId;

  const { data } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.user_id ?? null;
}

function planName(priceId: string, nickname?: string | null): string {
  return PLAN_NAMES[priceId] || nickname || "BeyondRounds Plan";
}

function ts(unix: number | null | undefined): string | null {
  return unix ? new Date(unix * 1000).toISOString() : null;
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const userId = session.metadata?.userId ?? session.client_reference_id;

  if (!customerId) {
    console.error("[checkout.session.completed] Missing customer id");
    return;
  }

  // Ensure customer row exists in subscriptions
  if (userId) {
    await supabase.from("subscriptions").upsert(
      { user_id: userId, stripe_customer_id: customerId, status: "incomplete", updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }

  // For subscription mode the subscription event fires separately — nothing more to do here.
  // For one-time payment mode, record the completed payment.
  if (session.mode === "payment" && session.payment_status === "paid" && userId) {
    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        status: "one_time_paid",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    console.log(`[checkout] One-time payment completed for user ${userId}`);
  }
}

async function onSubscriptionUpsert(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const item       = sub.items.data[0];
  const priceId    = item?.price.id ?? null;
  const interval   = item?.price.recurring?.interval ?? null;
  const intervalCount = item?.price.recurring?.interval_count ?? 1;

  // Resolve user_id — check customer metadata first
  let userId: string | null = null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    userId = (customer as Stripe.Customer).metadata?.userId ?? null;
  } catch { /* ignore */ }

  userId = userId ?? await getUserId(customerId);

  if (!userId) {
    console.error(`[subscription] Cannot resolve user for customer ${customerId}`);
    return;
  }

  // Build interval label (e.g. "month" | "3_months" | "6_months")
  const intervalLabel = interval
    ? intervalCount > 1 ? `${intervalCount}_${interval}s` : interval
    : null;

  await supabase.from("subscriptions").upsert(
    {
      user_id:                     userId,
      stripe_customer_id:          customerId,
      stripe_subscription_id:      sub.id,
      stripe_subscription_item_id: item?.id ?? null,
      stripe_price_id:             priceId,
      status:                      sub.status,
      plan_name:                   planName(priceId ?? "", item?.price.nickname),
      interval:                    intervalLabel,
      current_period_start:        ts(sub.current_period_start),
      current_period_end:          ts(sub.current_period_end),
      cancel_at_period_end:        sub.cancel_at_period_end,
      canceled_at:                 ts(sub.canceled_at),
      trial_end:                   ts(sub.trial_end),
      payment_failed_at:           null,        // cleared on successful subscription update
      updated_at:                  new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  console.log(`[subscription] Upserted ${sub.status} for user ${userId} (${sub.id})`);
}

async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const userId = await getUserId(customerId);

  if (!userId) {
    console.error(`[subscription.deleted] Cannot resolve user for customer ${customerId}`);
    return;
  }

  await supabase
    .from("subscriptions")
    .update({
      status:       "canceled",
      canceled_at:  new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .eq("user_id", userId);

  console.log(`[subscription.deleted] Marked canceled for user ${userId}`);
}

async function onInvoicePaid(invoice: Stripe.Invoice) {
  const customerId     = invoice.customer as string;
  const subscriptionId = invoice.subscription as string | null;

  const userId = await getUserId(customerId);
  if (!userId) {
    console.warn(`[invoice.paid] No user for customer ${customerId}`);
    return;
  }

  await supabase.from("invoices").upsert(
    {
      user_id:             userId,
      stripe_invoice_id:   invoice.id,
      amount:              invoice.amount_paid,
      currency:            invoice.currency,
      status:              "paid",
      invoice_pdf:         invoice.invoice_pdf,
      hosted_invoice_url:  invoice.hosted_invoice_url,
      period_start:        ts(invoice.period_start),
      period_end:          ts(invoice.period_end),
      paid_at:             ts(invoice.status_transitions?.paid_at),
    },
    { onConflict: "stripe_invoice_id" }
  );

  // Clear any payment-failed flag on the subscription
  if (subscriptionId) {
    await supabase
      .from("subscriptions")
      .update({ payment_failed_at: null, status: "active", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscriptionId);
  }

  console.log(`[invoice.paid] Saved invoice ${invoice.id} for user ${userId}`);
}

async function onInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId     = invoice.customer as string;
  const subscriptionId = invoice.subscription as string | null;

  const userId = await getUserId(customerId);
  if (!userId) {
    console.warn(`[invoice.payment_failed] No user for customer ${customerId}`);
    return;
  }

  // Upsert the failed invoice
  await supabase.from("invoices").upsert(
    {
      user_id:             userId,
      stripe_invoice_id:   invoice.id,
      amount:              invoice.amount_due,
      currency:            invoice.currency,
      status:              "open",
      invoice_pdf:         invoice.invoice_pdf,
      hosted_invoice_url:  invoice.hosted_invoice_url,
      period_start:        ts(invoice.period_start),
      period_end:          ts(invoice.period_end),
      attempt_count:       invoice.attempt_count,
      next_attempt:        invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null,
    },
    { onConflict: "stripe_invoice_id" }
  );

  // Mark subscription as past_due
  if (subscriptionId) {
    await supabase
      .from("subscriptions")
      .update({
        status:               "past_due",
        payment_failed_at:    new Date().toISOString(),
        next_payment_attempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000).toISOString()
          : null,
        updated_at:           new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);
  }

  console.log(`[invoice.payment_failed] Marked past_due for user ${userId}`);
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  console.log(`[webhook] ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await onSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await onInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.trial_will_end":
        // TODO: send email / push reminder
        console.log(`[trial_will_end] ${(event.data.object as Stripe.Subscription).id}`);
        break;

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    // Log but still return 200 — Stripe will retry on non-2xx
    console.error(`[webhook] Handler error for ${event.type}:`, err);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
