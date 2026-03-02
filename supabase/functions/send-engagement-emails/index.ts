// Deno Edge Function — Phase 3 engagement email sequence
// E1: Verification approved → "You're verified — welcome"
// E2: First group match → "You've been matched"
// E3: 7-day post-match follow-up → "How did it go?"
// Triggered daily by pg_cron at 8 AM UTC
// @ts-expect-error - Deno types are available at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno types are available at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerifiedMember {
  user_id: string;
  email: string;
  verified_welcome_sent_at: string | null;
}

interface MatchedMember {
  gm_id: string;
  user_id: string;
  email: string;
  match_welcome_sent_at: string | null;
}

interface FollowupMember {
  gm_id: string;
  user_id: string;
  email: string;
  followup_sent_at: string | null;
}

// ─── Zoho (ZeptoMail) sender ──────────────────────────────────────────────────

async function sendViaZeptoMail(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubUrl?: string;
}): Promise<void> {
  const mime_headers: Record<string, string> = {};
  if (opts.unsubUrl) {
    mime_headers["List-Unsubscribe"] = `<${opts.unsubUrl}>, <mailto:unsubscribe@beyondrounds.app>`;
    mime_headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

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
      ...(Object.keys(mime_headers).length > 0 && { mime_headers }),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ZeptoMail error ${response.status}: ${err}`);
  }
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function emailWrapper(body: string, unsubUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:#3A0B22;padding:18px 32px;">
      <span style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:0.02em;">BeyondRounds</span>
    </div>
    <div style="padding:32px 36px;">
      ${body}
      <p style="margin:36px 0 0;color:#9ca3af;font-size:12px;border-top:1px solid #f3f4f6;padding-top:18px;line-height:1.8;">
        You received this because you are a BeyondRounds member.<br>
        BeyondRounds · Berlin, Germany<br>
        <a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#1f2937;">${text}</p>`;
}

function ctaBox(content: string): string {
  return `<div style="background:#fdf2f8;border-left:3px solid #3A0B22;border-radius:0 8px 8px 0;padding:20px 24px;margin:0 0 24px;">${content}</div>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#3A0B22;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.01em;">${label}</a>`;
}

function note(text: string): string {
  return `<p style="margin:16px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">${text}</p>`;
}

function sig(): string {
  return `<p style="margin:32px 0 0;font-size:16px;color:#374151;line-height:1.7;">— Mostafa<br><span style="color:#6b7280;font-size:14px;">Founder, BeyondRounds</span></p>`;
}

function textFooter(): string {
  return `\n\n---\nYou received this because you are a BeyondRounds member.`;
}

// ─── E1: "You're verified — welcome to BeyondRounds" ──────────────────────────

function e1Html(profileLink: string, unsubUrl: string): string {
  return emailWrapper(
    p("Hi Doctor,") +
      p("Your credentials have been confirmed. You're officially a BeyondRounds member.") +
      p("Here's what happens next: We'll match you with a small group of doctors based on your schedule and interests.") +
      p("Keep an eye on your inbox — your first match notification is coming.") +
      ctaBox(
        btn(profileLink, "View your profile →") +
          note("Verified members always get priority in matching waves"),
      ) +
      sig(),
    unsubUrl,
  );
}

function e1Text(profileLink: string): string {
  return `Hi Doctor,

Your credentials have been confirmed. You're officially a BeyondRounds member.

Here's what happens next: We'll match you with a small group of doctors based on your schedule and interests.

Keep an eye on your inbox — your first match notification is coming.

View your profile: ${profileLink}

Note: Verified members always get priority in matching waves.

— Mostafa
Founder, BeyondRounds${textFooter()}`;
}

// ─── E2: "You've been matched" ─────────────────────────────────────────────────

function e2Html(groupsLink: string, unsubUrl: string): string {
  return emailWrapper(
    p("Hi Doctor,") +
      p("We've placed you in a group. Your first connection starts now.") +
      p("Reach out, introduce yourself, and set up a time to meet.") +
      ctaBox(
        btn(groupsLink, "See your group →") +
          note("Your group is small by design — 3–4 doctors, curated for you"),
      ) +
      sig(),
    unsubUrl,
  );
}

function e2Text(groupsLink: string): string {
  return `Hi Doctor,

We've placed you in a group. Your first connection starts now.

Reach out, introduce yourself, and set up a time to meet.

See your group: ${groupsLink}

Note: Your group is small by design — 3–4 doctors, curated for you.

— Mostafa
Founder, BeyondRounds${textFooter()}`;
}

// ─── E3: "How did it go?" ──────────────────────────────────────────────────────

function e3Html(feedbackLink: string, unsubUrl: string): string {
  return emailWrapper(
    p("Hi Doctor,") +
      p("It's been a week since you were matched. We hope the connection went well.") +
      p("A quick question: How was your first BeyondRounds meetup?") +
      ctaBox(
        btn(feedbackLink, "Share your feedback →") +
          note("Your response helps us improve matching for everyone"),
      ) +
      sig(),
    unsubUrl,
  );
}

function e3Text(feedbackLink: string): string {
  return `Hi Doctor,

It's been a week since you were matched. We hope the connection went well.

A quick question: How was your first BeyondRounds meetup?

Share your feedback: ${feedbackLink}

Note: Your response helps us improve matching for everyone.

— Mostafa
Founder, BeyondRounds${textFooter()}`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // @ts-expect-error - Deno global is available at runtime
    const zeptoApiKey = Deno.env.get("ZOHO_API_KEY");
    const zeptoFrom =
      // @ts-expect-error - Deno global is available at runtime
      Deno.env.get("ZOHO_FROM_WAITLIST") ?? "waitlist@beyondrounds.app";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const appUrl = (
      // @ts-expect-error - Deno global is available at runtime
      Deno.env.get("APP_URL") ?? "https://app.beyondrounds.app"
    ).replace(/\/$/, "");

    if (!zeptoApiKey) throw new Error("Missing ZOHO_API_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") ?? "all";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let totalSent = 0;
    let totalSkipped = 0;
    const results: Record<string, { sent: number; skipped: number }> = {};

    // ── E1: Verification approved → "You're verified — welcome" ───────────────

    if (mode === "e1" || mode === "all") {
      console.log("📧 E1: Sending verified-welcome emails...");
      let sent = 0;
      let skipped = 0;

      const { data: members, error: queryError } = await supabase
        .from("profiles")
        .select("user_id, email, verified_welcome_sent_at")
        .eq("verification_status", "approved")
        .is("verified_welcome_sent_at", null)
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;

      for (const member of (members as VerifiedMember[]) ?? []) {
        try {
          const profileLink = `${appUrl}/en/profile`;
          const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(member.email)}`;

          await sendViaZeptoMail({
            apiKey: zeptoApiKey,
            from: zeptoFrom,
            to: member.email,
            subject: "You're verified — welcome to BeyondRounds",
            html: e1Html(profileLink, unsubUrl),
            text: e1Text(profileLink),
            unsubUrl,
          });

          const { error: updateError } = await supabase
            .from("profiles")
            .update({ verified_welcome_sent_at: new Date().toISOString() })
            .eq("user_id", member.user_id);

          if (updateError) {
            console.error(
              `⚠️ E1: Failed to update tracking for ${member.email}:`,
              updateError,
            );
          }

          sent++;
          console.log(`✅ E1 → ${member.email}`);
        } catch (memberError) {
          console.error(`❌ E1: Failed for ${member.email}:`, memberError);
          skipped++;
        }
      }

      results.e1 = { sent, skipped };
      totalSent += sent;
      totalSkipped += skipped;
      console.log(`📧 E1 done: ${sent} sent, ${skipped} skipped`);
    }

    // ── E2: First group match → "You've been matched" ─────────────────────────

    if (mode === "e2" || mode === "all") {
      console.log("📧 E2: Sending match-welcome emails...");
      let sent = 0;
      let skipped = 0;

      const { data: members, error: queryError } = await supabase
        .from("group_members")
        .select(
          "id, user_id, profiles!inner(email), match_welcome_sent_at, joined_at",
        )
        .is("match_welcome_sent_at", null)
        .order("joined_at", { ascending: true });

      if (queryError) throw queryError;

      for (const row of (members as unknown as Array<{
        id: string;
        user_id: string;
        profiles: { email: string };
        match_welcome_sent_at: string | null;
        joined_at: string;
      }>) ?? []) {
        const member: MatchedMember = {
          gm_id: row.id,
          user_id: row.user_id,
          email: row.profiles.email,
          match_welcome_sent_at: row.match_welcome_sent_at,
        };

        try {
          const groupsLink = `${appUrl}/en/groups`;
          const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(member.email)}`;

          await sendViaZeptoMail({
            apiKey: zeptoApiKey,
            from: zeptoFrom,
            to: member.email,
            subject: "You've been matched — meet your BeyondRounds group",
            html: e2Html(groupsLink, unsubUrl),
            text: e2Text(groupsLink),
            unsubUrl,
          });

          const { error: updateError } = await supabase
            .from("group_members")
            .update({ match_welcome_sent_at: new Date().toISOString() })
            .eq("id", member.gm_id);

          if (updateError) {
            console.error(
              `⚠️ E2: Failed to update tracking for ${member.email}:`,
              updateError,
            );
          }

          sent++;
          console.log(`✅ E2 → ${member.email}`);
        } catch (memberError) {
          console.error(`❌ E2: Failed for ${member.email}:`, memberError);
          skipped++;
        }
      }

      results.e2 = { sent, skipped };
      totalSent += sent;
      totalSkipped += skipped;
      console.log(`📧 E2 done: ${sent} sent, ${skipped} skipped`);
    }

    // ── E3: 7-day post-match follow-up → "How did it go?" ─────────────────────

    if (mode === "e3" || mode === "all") {
      console.log("📧 E3: Sending post-match follow-up emails...");
      let sent = 0;
      let skipped = 0;

      const { data: members, error: queryError } = await supabase
        .from("group_members")
        .select(
          "id, user_id, profiles!inner(email), followup_sent_at, match_groups!inner(created_at)",
        )
        .is("followup_sent_at", null)
        .lt(
          "match_groups.created_at",
          new Date(Date.now() - 7 * 86_400_000).toISOString(),
        )
        .gt(
          "match_groups.created_at",
          new Date(Date.now() - 30 * 86_400_000).toISOString(),
        )
        .order("match_groups.created_at", { ascending: true });

      if (queryError) throw queryError;

      for (const row of (members as unknown as Array<{
        id: string;
        user_id: string;
        profiles: { email: string };
        followup_sent_at: string | null;
        match_groups: { created_at: string };
      }>) ?? []) {
        const member: FollowupMember = {
          gm_id: row.id,
          user_id: row.user_id,
          email: row.profiles.email,
          followup_sent_at: row.followup_sent_at,
        };

        try {
          const feedbackLink = `${appUrl}/en/feedback`;
          const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(member.email)}`;

          await sendViaZeptoMail({
            apiKey: zeptoApiKey,
            from: zeptoFrom,
            to: member.email,
            subject: "How was your BeyondRounds experience?",
            html: e3Html(feedbackLink, unsubUrl),
            text: e3Text(feedbackLink),
            unsubUrl,
          });

          const { error: updateError } = await supabase
            .from("group_members")
            .update({ followup_sent_at: new Date().toISOString() })
            .eq("id", member.gm_id);

          if (updateError) {
            console.error(
              `⚠️ E3: Failed to update tracking for ${member.email}:`,
              updateError,
            );
          }

          sent++;
          console.log(`✅ E3 → ${member.email}`);
        } catch (memberError) {
          console.error(`❌ E3: Failed for ${member.email}:`, memberError);
          skipped++;
        }
      }

      results.e3 = { sent, skipped };
      totalSent += sent;
      totalSkipped += skipped;
      console.log(`📧 E3 done: ${sent} sent, ${skipped} skipped`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        sent: totalSent,
        skipped: totalSkipped,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ Error in send-engagement-emails:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
