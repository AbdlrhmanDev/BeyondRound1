// @ts-nocheck — Deno Edge Function: processed by Deno runtime, not Node/tsc
// Supabase Edge Function: send-push-notification
// Sends a Web Push notification to all active subscriptions for a given user.
//
// Required env vars (Supabase Dashboard → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY          — your VAPID public key (base64url)
//   VAPID_PRIVATE_KEY         — your VAPID private key (base64url)
//   VAPID_SUBJECT             — https://yourdomain.com  OR  mailto:you@example.com
//
// Auto-injected by Supabase runtime (no action needed):
//   SUPABASE_URL              — project URL
//   SUPABASE_SERVICE_ROLE_KEY — service role key
//
// Payload: { userId, title, body, url?, tag?, icon?, image?, urgency?, requireInteraction? }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore — esm.sh CDN import
import webPush from "https://esm.sh/web-push@3.6.7";

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Init VAPID once at module level (not per request) ────────────────────────
// Supabase Edge Functions are warm-started — module-level init is safe and
// faster than re-running setVapidDetails on every invocation.
const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT     = Deno.env.get("VAPID_SUBJECT")     ?? "mailto:push@beyondrounds.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface PushPayload {
  userId:              string;
  title:               string;
  body:                string;
  url?:                string;
  tag?:                string;
  icon?:               string;
  image?:              string;
  urgency?:            "very-low" | "low" | "normal" | "high";
  requireInteraction?: boolean;
}

interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// ── TTL per urgency ───────────────────────────────────────────────────────────
const TTL_BY_URGENCY: Record<string, number> = {
  "very-low": 2_419_200, // 28 days
  "low":         604_800, // 7 days
  "normal":       86_400, // 24 hours  (default)
  "high":          3_600, // 1 hour
};

// ─────────────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── Validate VAPID config ────────────────────────────────────────────────
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(
      JSON.stringify({ error: "VAPID keys not configured — add them via Supabase Edge Function secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ── Supabase client (service role — bypasses RLS) ─────────────────────
    const supabaseUrl      = Deno.env.get("SUPABASE_URL")            ?? "";
    const supabaseKey      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase         = createClient(supabaseUrl, supabaseKey);

    // ── Parse + validate request body ─────────────────────────────────────
    let payload: PushPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.userId || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: "userId, title, and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Truncate to safe lengths (prevents oversized payloads — browser push limit is ~4 KB)
    payload.title = payload.title.slice(0, 60);
    payload.body  = payload.body.slice(0, 200);

    const urgency = payload.urgency ?? "normal";
    const ttl     = TTL_BY_URGENCY[urgency] ?? 86_400;

    // ── Query active subscriptions ────────────────────────────────────────
    const { data: subscriptions, error: dbError } = await supabase
      .from("user_push_subscriptions")
      .select("id, platform, token_or_subscription_json")
      .eq("user_id", payload.userId)
      .eq("is_active", true)
      .limit(20); // safety: max 20 active devices per user

    if (dbError) throw dbError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Build notification JSON ───────────────────────────────────────────
    const notificationData = JSON.stringify({
      title:              payload.title,
      body:               payload.body,
      icon:               payload.icon  ?? "/icon-192.png",
      badge:              "/icon-192.png",
      url:                payload.url   ?? "/",
      tag:                payload.tag   ?? "br-notification",
      image:              payload.image,
      requireInteraction: payload.requireInteraction ?? false,
    });

    // ── Send to each subscription ─────────────────────────────────────────
    let sent   = 0;
    let failed = 0;
    const expired: string[]  = [];
    const invalid: string[]  = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        // Only web push for now (native FCM/APNs is a separate path)
        if (sub.platform !== "web") return;

        // Parse subscription JSON
        let pushSub: WebPushSubscription;
        try {
          pushSub = JSON.parse(sub.token_or_subscription_json);
        } catch {
          console.warn(`⚠️  Invalid JSON for subscription ${sub.id}`);
          invalid.push(sub.id);
          failed++;
          return;
        }

        // Basic structural validation
        if (!pushSub.endpoint || !pushSub.keys?.p256dh || !pushSub.keys?.auth) {
          console.warn(`⚠️  Malformed subscription ${sub.id}`);
          invalid.push(sub.id);
          failed++;
          return;
        }

        try {
          await webPush.sendNotification(pushSub, notificationData, {
            TTL:     ttl,
            urgency,
            // topic: deduplicate notifications with the same tag on the push server
            ...(payload.tag ? { topic: payload.tag.slice(0, 32) } : {}),
          });
          sent++;
        } catch (err: unknown) {
          const statusCode =
            typeof err === "object" && err !== null && "statusCode" in err
              ? (err as { statusCode: number }).statusCode
              : 0;

          if (statusCode === 404 || statusCode === 410) {
            // 404 = endpoint not found, 410 = subscription gone — both mean expired
            expired.push(sub.id);
          } else if (statusCode === 429) {
            // Rate limited — log but don't mark inactive
            console.warn(`⚠️  Rate limited for subscription ${sub.id}`);
          } else {
            console.error(`❌ Push failed [${statusCode}] for ${sub.id}:`,
              err instanceof Error ? err.message : String(err));
          }
          failed++;
        }
      })
    );

    // ── Cleanup expired subscriptions ─────────────────────────────────────
    const toDeactivate = [...expired, ...invalid];
    if (toDeactivate.length > 0) {
      await supabase
        .from("user_push_subscriptions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("id", toDeactivate);
      console.log(`🗑️  Deactivated ${toDeactivate.length} expired/invalid subscription(s)`);
    }

    console.log(`📨 Push result: sent=${sent} failed=${failed} expired=${expired.length}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, expired: expired.length, total: subscriptions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ send-push-notification fatal error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
