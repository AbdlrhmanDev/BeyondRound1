// @ts-nocheck — Deno Edge Function: processed by Deno runtime, not Node/tsc
// Supabase Edge Function: stripe-checkout
// Creates a Stripe Checkout Session for subscriptions OR one-time payments.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const APP_URL      = "https://app.beyondrounds.app";
const CHECKOUT_URL = "https://checkout.beyondrounds.app"; // Stripe custom domain

const ALLOWED_ORIGINS = [
  APP_URL,
  "https://admin.beyondrounds.app",
  "https://whitelist.beyondrounds.app",
  "http://localhost:3000",
];

// Price IDs that are one-time payments (not subscriptions)
const ONE_TIME_PRICE_IDS = new Set([
  Deno.env.get("STRIPE_PRICE_ID_ONE_TIME") ?? "",
].filter(Boolean));

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allow  = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin":  allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

async function getOrCreateCustomer(
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<string> {
  // Check existing row
  const { data } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.stripe_customer_id) return data.stripe_customer_id;

  // Create new Stripe customer with userId in metadata for fast webhook lookups
  const customer = await stripe.customers.create({
    email:    userEmail,
    name:     userName ?? undefined,
    metadata: { userId },
  });

  // Persist immediately (webhook may arrive before redirect)
  await supabase.from("subscriptions").upsert(
    {
      user_id:            userId,
      stripe_customer_id: customer.id,
      status:             "inactive",
      updated_at:         new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return customer.id;
}

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")             ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── Auth ────────────────────────────────────────────────────────────────
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) throw Object.assign(new Error("Unauthorized"), { status: 401 });

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")      ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !user) throw Object.assign(new Error("Unauthorized"), { status: 401 });

    // ── Body ────────────────────────────────────────────────────────────────
    const { priceId, successUrl, cancelUrl } = await req.json();
    if (!priceId) throw new Error("priceId is required");

    // Detect mode: one-time vs subscription
    const isOneTime = ONE_TIME_PRICE_IDS.has(priceId);
    const mode = isOneTime ? "payment" : "subscription";

    // Get user profile for customer name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const customerId = await getOrCreateCustomer(
      stripe, supabase, user.id, user.email!, profile?.full_name
    );

    // For subscriptions: ensure only one active subscription (prevent duplicates)
    if (!isOneTime) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, stripe_subscription_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (sub?.status === "active" || sub?.status === "trialing") {
        throw new Error("You already have an active subscription. Use the switch plan option instead.");
      }
    }

    // ── Build session params ─────────────────────────────────────────────────
    const baseSuccess = successUrl || `${APP_URL}/settings?tab=billing&success=true`;
    const baseCancel  = cancelUrl  || `${APP_URL}/settings?tab=billing&canceled=true`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer:    customerId,
      mode,
      line_items:  [{ price: priceId, quantity: 1 }],
      success_url: baseSuccess,
      cancel_url:  baseCancel,
      // Embed userId so webhook can resolve user without a DB lookup
      metadata:    { userId: user.id },
      // Allow Apple Pay / Google Pay / Link
      payment_method_types: undefined, // let Stripe choose based on dashboard settings
      allow_promotion_codes: true,
    };

    // Subscription-only options
    if (mode === "subscription") {
      sessionParams.subscription_data = {
        metadata:                 { userId: user.id },
        trial_settings:           undefined,
      };
      // Use checkout.beyondrounds.app custom domain (set in Stripe Dashboard)
      // The URL is controlled by Stripe; we just create the session normally.
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...headers, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const msg    = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number }).status ?? 400;
    console.error("[stripe-checkout]", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...headers, "Content-Type": "application/json" }, status }
    );
  }
});
