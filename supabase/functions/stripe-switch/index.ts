// @ts-nocheck — Deno Edge Function: processed by Deno runtime, not Node/tsc
// Supabase Edge Function: stripe-switch
// Switches a user's subscription to a different price (upgrade/downgrade).
// Uses proration_behavior: "create_prorations" so the customer is
// credited/charged the difference immediately on the next invoice.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const ALLOWED_ORIGINS = [
  "https://app.beyondrounds.app",
  "http://localhost:3000",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allow  = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin":  allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
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
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")      ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !user) throw Object.assign(new Error("Unauthorized"), { status: 401 });

    // ── Body ─────────────────────────────────────────────────────────────────
    const { newPriceId } = await req.json();
    if (!newPriceId) throw new Error("newPriceId is required");

    // ── Get subscription ─────────────────────────────────────────────────────
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, stripe_subscription_item_id, stripe_price_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.stripe_subscription_id || !sub?.stripe_subscription_item_id) {
      throw new Error("No active subscription found.");
    }

    if (!["active", "trialing"].includes(sub.status)) {
      throw new Error(`Cannot switch plan: subscription is ${sub.status}.`);
    }

    if (sub.stripe_price_id === newPriceId) {
      throw new Error("You are already on this plan.");
    }

    // ── Update subscription on Stripe ────────────────────────────────────────
    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items: [
        {
          id:    sub.stripe_subscription_item_id,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    const newItem   = updated.items.data[0];
    const newPriceObj = newItem?.price;
    const intervalCount = newPriceObj?.recurring?.interval_count ?? 1;
    const interval      = newPriceObj?.recurring?.interval ?? null;
    const intervalLabel = interval
      ? intervalCount > 1 ? `${intervalCount}_${interval}s` : interval
      : null;

    // ── Update DB (webhook will also confirm) ────────────────────────────────
    await supabase
      .from("subscriptions")
      .update({
        stripe_price_id:             newPriceId,
        stripe_subscription_item_id: newItem?.id ?? sub.stripe_subscription_item_id,
        interval:                    intervalLabel,
        current_period_end:          updated.current_period_end
          ? new Date(updated.current_period_end * 1000).toISOString()
          : null,
        updated_at:                  new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ success: true, message: "Plan switched successfully." }),
      { headers: { ...headers, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const msg    = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number }).status ?? 400;
    console.error("[stripe-switch]", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...headers, "Content-Type": "application/json" }, status }
    );
  }
});
