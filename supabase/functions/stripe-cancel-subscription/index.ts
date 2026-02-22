// Deno Edge Function for canceling Stripe subscriptions
// @ts-expect-error - Deno types are available at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno types are available at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-expect-error - Stripe SDK for Deno
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const ALLOWED_ORIGINS = [
  "https://app.beyondrounds.app",
  "https://admin.beyondrounds.app",
  "https://whitelist.beyondrounds.app",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // @ts-expect-error - Deno global is available at runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the user via anon client (consistent with other edge functions)
    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription?.stripe_subscription_id) {
      throw new Error("No active subscription found");
    }

    // Cancel the subscription at period end
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Update database
    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription will cancel at the end of the billing period",
        cancel_at: canceledSubscription.cancel_at
          ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
          : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
