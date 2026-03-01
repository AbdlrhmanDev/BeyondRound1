// Deno Edge Function for sending transactional emails
// @ts-expect-error - Deno types are available at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno types are available at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type EmailTemplate = "booking_confirmation" | "match_ready" | "friday_reminder";

interface EmailRequest {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

interface TemplateResult {
  subject: string;
  html: string;
  text: string;
}

// Email template generator
function generateEmailTemplate(template: EmailTemplate, data: Record<string, unknown>): TemplateResult {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #333;
  `;

  const buttonStyle = `
    display: inline-block;
    background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
    color: white;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
  `;

  const headerStyle = `
    background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
    padding: 32px;
    text-align: center;
    border-radius: 16px 16px 0 0;
  `;

  switch (template) {
    case "booking_confirmation": {
      const { meetupType, date, city, neighborhood, dashboardUrl } = data as {
        meetupType: string;
        date: string;
        city: string;
        neighborhood?: string;
        dashboardUrl: string;
      };

      const meetupLabel = meetupType.charAt(0).toUpperCase() + meetupType.slice(1);

      return {
        subject: `You're booked for ${meetupLabel} on ${date}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="${baseStyle} margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <div style="${headerStyle}">
                <h1 style="color: white; margin: 0; font-size: 28px;">You're Booked!</h1>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 18px; margin-bottom: 24px;">
                  Great news! Your <strong>${meetupLabel}</strong> meetup is confirmed.
                </p>

                <div style="background: #fff7ed; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${date}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Type:</strong> ${meetupLabel}</p>
                  <p style="margin: 0 0 8px 0;"><strong>City:</strong> ${city}</p>
                  ${neighborhood ? `<p style="margin: 0;"><strong>Area:</strong> ${neighborhood}</p>` : ''}
                </div>

                <h2 style="font-size: 18px; margin-bottom: 16px;">What happens next?</h2>
                <ol style="padding-left: 20px; margin-bottom: 24px;">
                  <li style="margin-bottom: 8px;">On Thursday at 4 PM, you'll be matched with 2-3 other doctors</li>
                  <li style="margin-bottom: 8px;">A group chat will open where you can meet and plan</li>
                  <li style="margin-bottom: 8px;">Our RoundsBot assistant will help break the ice!</li>
                </ol>

                <div style="text-align: center; margin-top: 32px;">
                  <a href="${dashboardUrl}" style="${buttonStyle}">
                    View Your Dashboard
                  </a>
                </div>
              </div>
              <div style="padding: 24px; background: #f9fafb; text-align: center; font-size: 14px; color: #6b7280;">
                <p style="margin: 0;">BeyondRounds - Where Doctors Become Friends</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `You're Booked for ${meetupLabel}!

Great news! Your ${meetupLabel} meetup is confirmed.

Date: ${date}
Type: ${meetupLabel}
City: ${city}
${neighborhood ? `Area: ${neighborhood}` : ''}

What happens next?
1. On Thursday at 4 PM, you'll be matched with 2-3 other doctors
2. A group chat will open where you can meet and plan
3. Our RoundsBot assistant will help break the ice!

View your dashboard: ${dashboardUrl}

BeyondRounds - Where Doctors Become Friends`,
      };
    }

    case "match_ready": {
      const { memberNames, memberCount, chatUrl, matchWeek } = data as {
        memberNames: string[];
        memberCount: number;
        chatUrl: string;
        matchWeek: string;
      };

      const namesDisplay = memberNames.length > 0
        ? memberNames.slice(0, 3).join(", ") + (memberNames.length > 3 ? ` and ${memberNames.length - 3} more` : "")
        : `${memberCount} other doctors`;

      return {
        subject: "Your group is ready - chat now!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="${baseStyle} margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <div style="${headerStyle}">
                <h1 style="color: white; margin: 0; font-size: 28px;">Your Group is Ready!</h1>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 18px; margin-bottom: 24px;">
                  Great news! You've been matched with ${namesDisplay} for the week of ${matchWeek}.
                </p>

                <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                  <p style="margin: 0; font-size: 16px; color: #059669;">
                    <strong>${memberCount} doctors</strong> in your group
                  </p>
                </div>

                <p style="margin-bottom: 24px;">
                  Head to the chat to introduce yourself, share your interests, and start planning your meetup together!
                </p>

                <div style="text-align: center; margin-top: 32px;">
                  <a href="${chatUrl}" style="${buttonStyle}">
                    Open Group Chat
                  </a>
                </div>
              </div>
              <div style="padding: 24px; background: #f9fafb; text-align: center; font-size: 14px; color: #6b7280;">
                <p style="margin: 0;">BeyondRounds - Where Doctors Become Friends</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Your Group is Ready!

Great news! You've been matched with ${namesDisplay} for the week of ${matchWeek}.

${memberCount} doctors in your group.

Head to the chat to introduce yourself, share your interests, and start planning your meetup together!

Open group chat: ${chatUrl}

BeyondRounds - Where Doctors Become Friends`,
      };
    }

    case "friday_reminder": {
      const { meetupType, chatUrl, groupMembers } = data as {
        meetupType: string;
        chatUrl: string;
        groupMembers?: string[];
      };

      const meetupLabel = meetupType.charAt(0).toUpperCase() + meetupType.slice(1);

      return {
        subject: "Your meetup is tomorrow!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="${baseStyle} margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <div style="${headerStyle}">
                <h1 style="color: white; margin: 0; font-size: 28px;">Meetup Tomorrow!</h1>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 18px; margin-bottom: 24px;">
                  Just a friendly reminder - your <strong>${meetupLabel}</strong> meetup is tomorrow!
                </p>

                ${groupMembers && groupMembers.length > 0 ? `
                <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <p style="margin: 0 0 12px 0; font-weight: 600;">Your group:</p>
                  <p style="margin: 0;">${groupMembers.join(", ")}</p>
                </div>
                ` : ''}

                <p style="margin-bottom: 24px;">
                  Have you finalized your plans? Make sure everyone knows the time and place!
                </p>

                <div style="text-align: center; margin-top: 32px;">
                  <a href="${chatUrl}" style="${buttonStyle}">
                    Check Group Chat
                  </a>
                </div>
              </div>
              <div style="padding: 24px; background: #f9fafb; text-align: center; font-size: 14px; color: #6b7280;">
                <p style="margin: 0;">BeyondRounds - Where Doctors Become Friends</p>
                <p style="margin: 8px 0 0 0; font-size: 12px;">
                  <a href="#" style="color: #6b7280;">Manage email preferences</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Meetup Tomorrow!

Just a friendly reminder - your ${meetupLabel} meetup is tomorrow!

${groupMembers && groupMembers.length > 0 ? `Your group: ${groupMembers.join(", ")}` : ''}

Have you finalized your plans? Make sure everyone knows the time and place!

Check group chat: ${chatUrl}

BeyondRounds - Where Doctors Become Friends`,
      };
    }

    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // @ts-expect-error - Deno global is available at runtime
    const zohoApiKey = Deno.env.get("ZOHO_API_KEY");
    // @ts-expect-error - Deno global is available at runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!zohoApiKey) {
      throw new Error("Missing ZOHO_API_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { to, template, data } = (await req.json()) as EmailRequest;

    if (!to || !template || !data) {
      throw new Error("Missing required fields: to, template, data");
    }

    // Check user's email preferences if userId is provided
    const userId = data.userId as string | undefined;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email_preferences")
        .eq("user_id", userId)
        .single();

      const prefs = profile?.email_preferences as Record<string, boolean> | null;

      // Check specific preference based on template
      if (prefs) {
        if (template === "booking_confirmation" && prefs.booking_confirmations === false) {
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: "User disabled booking emails" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
        if (template === "match_ready" && prefs.match_notifications === false) {
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: "User disabled match emails" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
        if (template === "friday_reminder" && prefs.reminders === false) {
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: "User disabled reminder emails" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
      }
    }

    // Generate email content from template
    const { subject, html, text } = generateEmailTemplate(template, data);

    // Send email via Zoho (ZeptoMail API)
    const response = await fetch("https://api.zeptomail.eu/v1.1/email", {
      method: "POST",
      headers: {
        "Authorization": `Zoho-enczapikey ${zohoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { address: "hello@beyondrounds.app", name: "BeyondRounds" },
        to: [{ email_address: { address: to } }],
        subject,
        htmlbody: html,
        textbody: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Zoho API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();

    console.log(`Email sent to ${to}: ${template}`, result);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
        template,
        to,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error sending email:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
