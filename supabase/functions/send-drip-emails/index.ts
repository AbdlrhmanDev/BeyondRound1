// Deno Edge Function — sends drip campaign emails to waitlist members
// Triggered daily by pg_cron; stops automatically once LAUNCH_DATE is reached.
// Uses ZeptoMail HTTP API (EU region) — no Resend dependency.
// @ts-expect-error - Deno types are available at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno types are available at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendViaZeptoMail(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const response = await fetch("https://api.zeptomail.eu/v1.1/email", {
    method: "POST",
    headers: {
      Authorization: `Zoho-enczapikey ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { address: opts.from },
      to: [{ email_address: { address: opts.to } }],
      subject: opts.subject,
      htmlbody: opts.html,
      textbody: opts.text,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ZeptoMail error ${response.status}: ${err}`);
  }
}

function buildEmailHtml(dripNumber: number, locale: string): string {
  const isDe = locale === "de";

  const title = isDe
    ? "Die Plattform ist fast fertig! 🚀"
    : "The platform is almost ready! 🚀";
  const body = isDe
    ? "Wir arbeiten hart daran, Ihnen die bestmögliche Erfahrung zu bieten. Jeden Tag bringen wir neue Funktionen zum Leben."
    : "We're working hard to bring you the best possible experience. Every day we bring new features to life so you feel right at home from day one.";
  const shareTitle = isDe ? "Kennen Sie andere Ärzte?" : "Know other doctors?";
  const shareBody = isDe
    ? "Helfen Sie uns, die Community aufzubauen! Teilen Sie BeyondRounds mit Ihren Kollegen."
    : "Help us build the community! Share BeyondRounds with your colleagues — the more doctors join, the better the connections.";
  const footer = isDe
    ? "Bleiben Sie gespannt — es lohnt sich!"
    : "Stay tuned — it will be worth it!";
  const unsubNote = isDe
    ? "Sie erhalten diese E-Mail, weil Sie sich auf der BeyondRounds-Warteliste angemeldet haben."
    : "You are receiving this email because you signed up for the BeyondRounds waitlist.";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #3A0B22 0%, #5B1A3A 100%); padding: 32px; text-align: center;">
          <p style="color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; margin: 0 0 8px 0;">Update #${dripNumber}</p>
          <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; margin-bottom: 24px;">${body}</p>
          <div style="background: #fdf2f8; border: 1px solid #f0c4dc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #3A0B22; margin: 0 0 8px 0;">${shareTitle}</h2>
            <p style="font-size: 14px; color: #5B1A3A; margin: 0;">${shareBody}</p>
          </div>
          <p style="font-size: 14px; color: #6b7280; font-style: italic;">${footer}</p>
        </div>
        <div style="padding: 24px; background: #f9fafb; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">${unsubNote}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">BeyondRounds</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildEmailText(dripNumber: number, locale: string): string {
  const isDe = locale === "de";
  if (isDe) {
    return `Update #${dripNumber} — Die Plattform ist fast fertig!

Wir arbeiten hart daran, Ihnen die bestmögliche Erfahrung zu bieten.

Kennen Sie andere Ärzte? Helfen Sie uns, die Community aufzubauen und teilen Sie BeyondRounds mit Ihren Kollegen.

Bleiben Sie gespannt — es lohnt sich!

BeyondRounds`;
  }
  return `Update #${dripNumber} — The platform is almost ready!

We're working hard to bring you the best possible experience.

Know other doctors? Help us build the community and share BeyondRounds with your colleagues.

Stay tuned — it will be worth it!

BeyondRounds`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // @ts-expect-error - Deno global is available at runtime
    const zeptoApiKey = Deno.env.get("ZEPTOMAIL_API_KEY");
    // @ts-expect-error - Deno global is available at runtime
    const zeptoFrom = Deno.env.get("ZEPTOMAIL_FROM") ?? "no-reply@beyondrounds.app";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const launchDateStr = Deno.env.get("LAUNCH_DATE") ?? "";

    if (!zeptoApiKey) throw new Error("Missing ZEPTOMAIL_API_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    // Stop sending once launch date has passed
    if (launchDateStr) {
      const launchDate = new Date(launchDateStr);
      if (!isNaN(launchDate.getTime()) && new Date() >= launchDate) {
        console.log("🚀 Launch date reached — drip campaign complete.");
        return new Response(
          JSON.stringify({ success: true, sent: 0, skipped: 0, reason: "past_launch_date" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("📧 Starting drip email process...");

    // Members who signed up 3+ days ago and haven't received a drip in 3+ days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: members, error: queryError } = await supabase
      .from("waitlist")
      .select("id, email, drip_count, last_drip_sent_at")
      .lte("created_at", threeDaysAgo)
      .or(`last_drip_sent_at.is.null,last_drip_sent_at.lte.${threeDaysAgo}`);

    if (queryError) throw queryError;

    console.log(`📋 Found ${members?.length ?? 0} members due for drip`);

    let sent = 0;
    let skipped = 0;

    for (const member of members ?? []) {
      try {
        const dripNumber = (member.drip_count ?? 0) + 1;
        const locale = "de"; // default to German (primary market)

        const subject =
          locale === "de"
            ? `Update #${dripNumber} — BeyondRounds kommt bald!`
            : `Update #${dripNumber} — BeyondRounds is coming soon!`;

        await sendViaZeptoMail({
          apiKey: zeptoApiKey,
          from: zeptoFrom,
          to: member.email,
          subject,
          html: buildEmailHtml(dripNumber, locale),
          text: buildEmailText(dripNumber, locale),
        });

        // Update tracking columns
        const { error: updateError } = await supabase
          .from("waitlist")
          .update({
            last_drip_sent_at: new Date().toISOString(),
            drip_count: dripNumber,
          })
          .eq("id", member.id);

        if (updateError) {
          console.error(`⚠️ Failed to update drip tracking for ${member.email}:`, updateError);
        }

        sent++;
        console.log(`✅ Drip #${dripNumber} sent to ${member.email}`);
      } catch (memberError) {
        console.error(`❌ Failed drip for ${member.email}:`, memberError);
        skipped++;
      }
    }

    console.log(`📧 Drip campaign complete: ${sent} sent, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ success: true, sent, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error in send-drip-emails:", errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
