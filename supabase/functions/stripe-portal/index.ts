// @ts-nocheck — Deno Edge Function: processed by Deno runtime, not Node/tsc
// Supabase Edge Function: stripe-portal
// Creates a Stripe Customer Portal session so users can manage their
// payment method, download invoices, and view billing history.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const APP_URL = "https://app.beyondrounds.app";

const ALLOWED_ORIGINS = [
  APP_URL,
  "https://admin.beyondrounds.app",
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
    if (!token) throw Object.assign(new Error("Unauthorized"), { status: 401 });

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")      ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !user) throw Object.assign(new Error("Unauthorized"), { status: 401 });

    // ── Get Stripe customer ID ───────────────────────────────────────────────
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      throw new Error("No billing account found. Please subscribe first.");
    }

    // ── Parse optional return_url — validated against allowlist ─────────────
    const ALLOWED_RETURN_HOSTS = new Set([
      "app.beyondrounds.app",
      "admin.beyondrounds.app",
      "whitelist.beyondrounds.app",
      "localhost",
    ]);

    function validateReturnUrl(raw: unknown, fallback: string): string {
      if (typeof raw !== "string" || !raw.trim()) return fallback;
      try {
        const url = new URL(raw);
        if (url.protocol !== "https:" && url.hostname !== "localhost") return fallback;
        if (!ALLOWED_RETURN_HOSTS.has(url.hostname)) return fallback;
        return raw;
      } catch {
        return fallback;
      }
    }

    const defaultReturn = `${APP_URL}/settings?tab=billing`;
    let returnUrl = defaultReturn;
    try {
      const body = await req.json();
      returnUrl = validateReturnUrl(body?.returnUrl, defaultReturn);
    } catch { /* body is optional */ }

    // ── Create portal session ────────────────────────────────────────────────
    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   sub.stripe_customer_id,
      return_url: returnUrl,
    });

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { headers: { ...headers, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const msg    = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number }).status ?? 400;
    console.error("[stripe-portal]", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...headers, "Content-Type": "application/json" }, status }
    );
  }
});
