// Deno Edge Function — Phase 2 launch email sequence
// L1: Broadcast "your spot is ready" to all waitlist
// L2: 48h follow-up to non-signups
// L3: Verification nudge to new signups who haven't verified
// Triggered manually by admin via /api/admin/launch
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

interface WaitlistMember {
  id: string;
  email: string;
  launch_l1_sent_at: string | null;
  launch_l2_sent_at: string | null;
  unsubscribed_at: string | null;
}

interface ProfileMember {
  id: string;
  email: string;
  verification_status: string | null;
  created_at: string;
  verify_nudge_sent_at: string | null;
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
        You received this because you joined the BeyondRounds early access list.<br>
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

function ul(items: string[]): string {
  const lis = items
    .map(
      (i) =>
        `<li style="margin-bottom:8px;font-size:16px;line-height:1.6;color:#1f2937;">${i}</li>`,
    )
    .join("");
  return `<ul style="margin:0 0 24px;padding-left:22px;">${lis}</ul>`;
}

function ctaBox(content: string): string {
  return `<div style="background:#fdf2f8;border-left:3px solid #3A0B22;border-radius:0 8px 8px 0;padding:20px 24px;margin:0 0 24px;">${content}</div>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#3A0B22;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.01em;">${label}</a>`;
}

function sig(): string {
  return `<p style="margin:32px 0 0;font-size:16px;color:#374151;line-height:1.7;">— Mostafa<br><span style="color:#6b7280;font-size:14px;">Founder, BeyondRounds</span></p>`;
}

function textFooter(): string {
  return `\n\n---\nYou received this because you joined the BeyondRounds early access list.`;
}

// ─── L1: "Your spot is ready" ─────────────────────────────────────────────────

function l1Html(signupLink: string, unsubUrl: string): string {
  return emailWrapper(
    p("Hi Doctor,") +
      p("You're one of the first. We kept your spot.") +
      p("Here's what's next:") +
      ul([
        "<strong>Create your account</strong> — takes 60 seconds.",
        "<strong>Get matched</strong> — we'll place you in a small group based on your interests and schedule.",
        "<strong>Meet doctors</strong> — real meetups, curated by us.",
      ]) +
      ctaBox(
        `<p style="margin:0 0 14px;font-size:15px;color:#5B1A3A;line-height:1.6;">Spots fill in waves — early members get priority matching.</p>` +
          btn(signupLink, "Join BeyondRounds →"),
      ) +
      sig(),
    unsubUrl,
  );
}

function l1Text(signupLink: string): string {
  return `Hi Doctor,

You're one of the first. We kept your spot.

Here's what's next:
- Create your account — takes 60 seconds.
- Get matched — we'll place you in a small group based on your interests and schedule.
- Meet doctors — real meetups, curated by us.

Spots fill in waves — early members get priority matching.

Join BeyondRounds: ${signupLink}

— Mostafa
Founder, BeyondRounds${textFooter()}`;
}

// ─── L2: "Don't lose your spot" ───────────────────────────────────────────────

function l2Html(signupLink: string, unsubUrl: string): string {
  return emailWrapper(
    p("Hi Doctor,") +
      p(
        "We sent you an invite 2 days ago. Your spot is still open — but filling fast.",
      ) +
      p(
        "We're letting in doctors in small waves. Once this wave closes, the next opening could be weeks away.",
      ) +
      ctaBox(btn(signupLink, "Claim your spot →")) +
      sig(),
    unsubUrl,
  );
}

function l2Text(signupLink: string): string {
  return `Hi Doctor,

We sent you an invite 2 days ago. Your spot is still open — but filling fast.

We're letting in doctors in small waves. Once this wave closes, the next opening could be weeks away.

Claim your spot: ${signupLink}

— Mostafa
Founder, BeyondRounds${textFooter()}`;
}

// ─── L3: "One step left — verify your credentials" ────────────────────────────

function l3Html(profileLink: string, unsubUrl: string): string {
  return emailWrapper(
    p("Hi Doctor,") +
      p(
        "Your account is ready. To join your first group, we need to confirm you're a doctor.",
      ) +
      p("Takes 2 minutes. Private + secure.") +
      ctaBox(
        `<p style="margin:0 0 14px;font-size:15px;color:#5B1A3A;line-height:1.6;">Only verified members are included in matching.</p>` +
          btn(profileLink, "Complete verification →"),
      ) +
      sig(),
    unsubUrl,
  );
}

function l3Text(profileLink: string): string {
  return `Hi Doctor,

Your account is ready. To join your first group, we need to confirm you're a doctor.

Takes 2 minutes. Private + secure.

Only verified members are included in matching.

Complete verification: ${profileLink}

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

    // ── L1: Broadcast to all waitlist members who haven't received it ──────────

    if (mode === "l1" || mode === "all") {
      console.log("📧 L1: Sending launch broadcast...");
      let sent = 0;
      let skipped = 0;

      const { data: members, error: queryError } = await supabase
        .from("waitlist")
        .select(
          "id, email, launch_l1_sent_at, launch_l2_sent_at, unsubscribed_at",
        )
        .is("unsubscribed_at", null)
        .is("launch_l1_sent_at", null)
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;

      for (const member of (members as WaitlistMember[]) ?? []) {
        try {
          const emailSlug = encodeURIComponent(member.email);
          const signupLink = `${appUrl}/en/auth`;
          const unsubUrl = `${appUrl}/unsubscribe?email=${emailSlug}`;

          await sendViaZeptoMail({
            apiKey: zeptoApiKey,
            from: zeptoFrom,
            to: member.email,
            subject: "BeyondRounds is open — your spot is ready",
            html: l1Html(signupLink, unsubUrl),
            text: l1Text(signupLink),
            unsubUrl,
          });

          const { error: updateError } = await supabase
            .from("waitlist")
            .update({ launch_l1_sent_at: new Date().toISOString() })
            .eq("id", member.id);

          if (updateError) {
            console.error(
              `⚠️ L1: Failed to update tracking for ${member.email}:`,
              updateError,
            );
          }

          sent++;
          console.log(`✅ L1 → ${member.email}`);
        } catch (memberError) {
          console.error(`❌ L1: Failed for ${member.email}:`, memberError);
          skipped++;
        }
      }

      results.l1 = { sent, skipped };
      totalSent += sent;
      totalSkipped += skipped;
      console.log(`📧 L1 done: ${sent} sent, ${skipped} skipped`);
    }

    // ── L2: 48h follow-up to non-signups ──────────────────────────────────────

    if (mode === "l2" || mode === "all") {
      console.log("📧 L2: Sending 48h follow-up to non-signups...");
      let sent = 0;
      let skipped = 0;

      const { data: members, error: queryError } = await supabase
        .from("waitlist")
        .select(
          "id, email, launch_l1_sent_at, launch_l2_sent_at, unsubscribed_at",
        )
        .is("unsubscribed_at", null)
        .is("launch_l2_sent_at", null)
        .not("launch_l1_sent_at", "is", null)
        .lt(
          "launch_l1_sent_at",
          new Date(Date.now() - 48 * 3_600_000).toISOString(),
        )
        .order("launch_l1_sent_at", { ascending: true });

      if (queryError) throw queryError;

      // Get all signed-up users to exclude them
      const { data: authUsers } = await supabase.auth.admin.listUsers({
        perPage: 1000,
      });
      const signedUpEmails = new Set(
        (authUsers?.users ?? [])
          .map((u: { email?: string }) => u.email?.toLowerCase())
          .filter(Boolean),
      );

      for (const member of (members as WaitlistMember[]) ?? []) {
        try {
          // Skip if already signed up
          if (signedUpEmails.has(member.email.toLowerCase())) {
            skipped++;
            console.log(`⏭️ L2: Already signed up, skipping ${member.email}`);
            continue;
          }

          const emailSlug = encodeURIComponent(member.email);
          const signupLink = `${appUrl}/en/auth`;
          const unsubUrl = `${appUrl}/unsubscribe?email=${emailSlug}`;

          await sendViaZeptoMail({
            apiKey: zeptoApiKey,
            from: zeptoFrom,
            to: member.email,
            subject: "Your BeyondRounds spot expires in 24 hours",
            html: l2Html(signupLink, unsubUrl),
            text: l2Text(signupLink),
            unsubUrl,
          });

          const { error: updateError } = await supabase
            .from("waitlist")
            .update({ launch_l2_sent_at: new Date().toISOString() })
            .eq("id", member.id);

          if (updateError) {
            console.error(
              `⚠️ L2: Failed to update tracking for ${member.email}:`,
              updateError,
            );
          }

          sent++;
          console.log(`✅ L2 → ${member.email}`);
        } catch (memberError) {
          console.error(`❌ L2: Failed for ${member.email}:`, memberError);
          skipped++;
        }
      }

      results.l2 = { sent, skipped };
      totalSent += sent;
      totalSkipped += skipped;
      console.log(`📧 L2 done: ${sent} sent, ${skipped} skipped`);
    }

    // ── L3: Verification nudge to new signups ─────────────────────────────────

    if (mode === "l3" || mode === "all") {
      console.log("📧 L3: Sending verification nudge...");
      let sent = 0;
      let skipped = 0;

      const { data: members, error: queryError } = await supabase
        .from("profiles")
        .select(
          "id, email, verification_status, created_at, verify_nudge_sent_at",
        )
        .is("verification_status", null)
        .is("verify_nudge_sent_at", null)
        .lt("created_at", new Date(Date.now() - 24 * 3_600_000).toISOString())
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;

      for (const member of (members as ProfileMember[]) ?? []) {
        try {
          const profileLink = `${appUrl}/en/profile`;
          const emailSlug = encodeURIComponent(member.email);
          const unsubUrl = `${appUrl}/unsubscribe?email=${emailSlug}`;

          await sendViaZeptoMail({
            apiKey: zeptoApiKey,
            from: zeptoFrom,
            to: member.email,
            subject: "One step left — verify your credentials",
            html: l3Html(profileLink, unsubUrl),
            text: l3Text(profileLink),
            unsubUrl,
          });

          const { error: updateError } = await supabase
            .from("profiles")
            .update({ verify_nudge_sent_at: new Date().toISOString() })
            .eq("id", member.id);

          if (updateError) {
            console.error(
              `⚠️ L3: Failed to update tracking for ${member.email}:`,
              updateError,
            );
          }

          sent++;
          console.log(`✅ L3 → ${member.email}`);
        } catch (memberError) {
          console.error(`❌ L3: Failed for ${member.email}:`, memberError);
          skipped++;
        }
      }

      results.l3 = { sent, skipped };
      totalSent += sent;
      totalSkipped += skipped;
      console.log(`📧 L3 done: ${sent} sent, ${skipped} skipped`);
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
    console.error("❌ Error in send-launch-emails:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
