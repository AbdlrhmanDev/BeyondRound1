// @ts-nocheck — Deno Edge Function: processed by Deno runtime, not Node/tsc
// Supabase Edge Function: stripe-resume
// Re-enables a subscription that was set to cancel_at_period_end.

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

    // ── Get subscription ─────────────────────────────────────────────────────
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, cancel_at_period_end, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) {
      throw new Error("No subscription found.");
    }

    if (!sub.cancel_at_period_end) {
      throw new Error("Subscription is not pending cancellation.");
    }

    if (sub.status === "canceled") {
      throw new Error("Subscription has already ended. Please subscribe again.");
    }

    // ── Resume on Stripe ─────────────────────────────────────────────────────
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // ── Update DB optimistically (webhook confirms shortly after) ────────────
    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: false,
        canceled_at:          null,
        updated_at:           new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ success: true, message: "Subscription resumed successfully." }),
      { headers: { ...headers, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const msg    = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number }).status ?? 400;
    console.error("[stripe-resume]", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...headers, "Content-Type": "application/json" }, status }
    );
  }
});
