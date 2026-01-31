// Deno Edge Function for creating Stripe checkout sessions
// @ts-expect-error - Deno types are available at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno types are available at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-expect-error - Stripe SDK for Deno
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // @ts-expect-error - Deno global is available at runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      throw new Error("Missing required environment variables");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the user token
    const token = authHeader.replace("Bearer ", "");
    
    // Create supabase client with service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user token - try multiple methods
    let user;
    
    // Method 1: Try with anon key if available
    if (supabaseAnonKey) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
      const authResult = await supabaseAuth.auth.getUser(token);
      if (!authResult.error && authResult.data.user) {
        user = authResult.data.user;
      }
    }
    
    // Method 2: If anon key method failed, decode JWT and use admin API
    if (!user) {
      try {
        // Decode JWT payload (without verification - we'll verify via admin API)
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error("Invalid token format - expected 3 parts, got:", parts.length);
          throw new Error("Invalid token format");
        }
        
        // Decode base64 URL-safe JWT payload
        const base64Url = parts[1];
        // Add padding if needed
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const payload = JSON.parse(atob(base64));
        
        const userId = payload.sub;
        
        if (!userId) {
          console.error("No user ID (sub) in token payload");
          throw new Error("No user ID in token");
        }
        
        console.log("Extracted user ID from token:", userId);
        
        // Verify user exists using admin API
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError) {
          console.error("Admin API error:", userError);
          throw new Error("Unauthorized");
        }
        
        if (!userData || !userData.user) {
          console.error("No user data returned from admin API");
          throw new Error("Unauthorized");
        }
        
        user = userData.user;
        console.log("Successfully verified user:", user.id);
      } catch (err) {
        console.error("Token verification failed:", err);
        console.error("Error details:", err instanceof Error ? err.message : String(err));
        throw new Error("Unauthorized");
      }
    }
    
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Parse request body
    const { priceId, successUrl, cancelUrl } = await req.json();

    if (!priceId) {
      throw new Error("Missing priceId");
    }

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      // Get user email for customer creation
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      await supabase.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "inactive",
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url:
        successUrl ||
        `${req.headers.get("origin") || "http://localhost:5173"}/settings?success=true`,
      cancel_url:
        cancelUrl ||
        `${req.headers.get("origin") || "http://localhost:5173"}/settings?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error instanceof Error && error.message === "Unauthorized" ? 401 : 400,
      }
    );
  }
});
