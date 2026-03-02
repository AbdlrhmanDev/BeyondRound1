// Deno Edge Function — structured pre-launch drip email sequence
// Email 1 → Day 1 | Email 2 → Day 3 | Email 3 → Day 6 | Email 4 → Day 10
// After Email 4: weekly nurture loop (every 7 days)
// Triggered daily by pg_cron.
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
  drip_count: number;
  last_drip_sent_at: string | null;
  created_at: string;
  unsubscribed_at: string | null;
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

// ─── Timing logic ─────────────────────────────────────────────────────────────
// Hours that must have passed before the next email in the sequence is sent.
// drip_count = 0 → Email 1 (uses created_at as reference)
// drip_count = 1 → Email 2 | drip_count = 2 → Email 3 | drip_count = 3 → Email 4
// drip_count >= 4 → Weekly nurture (7 days between sends)

const STEP_DELAY_HOURS: Record<number, number> = {
  0: 24,  // Email 1: 1 day after signup
  1: 48,  // Email 2: 2 days after Email 1
  2: 72,  // Email 3: 3 days after Email 2
  3: 96,  // Email 4: 4 days after Email 3
};
const WEEKLY_DELAY_HOURS = 168;

function isDue(member: WaitlistMember): boolean {
  const step = member.drip_count;
  const delayMs = (step < 4 ? STEP_DELAY_HOURS[step] : WEEKLY_DELAY_HOURS) * 3_600_000;
  // For the very first drip, compare against signup time
  const reference = step === 0 ? member.created_at : member.last_drip_sent_at;
  if (!reference) return false;
  return Date.now() - new Date(reference).getTime() >= delayMs;
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

function ol(items: string[]): string {
  const lis = items
    .map((i) => `<li style="margin-bottom:14px;font-size:16px;line-height:1.6;color:#1f2937;">${i}</li>`)
    .join("");
  return `<ol style="margin:0 0 24px;padding-left:22px;">${lis}</ol>`;
}

function ul(items: string[]): string {
  const lis = items
    .map((i) => `<li style="margin-bottom:8px;font-size:16px;line-height:1.6;color:#1f2937;">${i}</li>`)
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

// ─── Email 1: How matching will work ─────────────────────────────────────────

function email1Html(prefsLink: string, unsubUrl: string): string {
  return emailWrapper(
    p("Hi Doctor,") +
    p("Quick overview of how BeyondRounds works:") +
    ol([
      "<strong>Verified doctors only</strong><br>We confirm membership privately to keep the community safe.",
      "<strong>Small curated groups</strong><br>You'll be placed in a small group based on your interests + availability.",
      "<strong>Weekly waves, not spammy events</strong><br>We open new matches in waves so people actually meet.",
    ]) +
    p("If you want us to match you better, tell us what you prefer:") +
    ctaBox(
      `<p style="margin:0 0 14px;font-size:15px;color:#5B1A3A;line-height:1.8;">
        Coffee / dinner / sports / walks<br>
        English / German<br>
        Typical free days
      </p>` +
      btn(prefsLink, "Set your preferences →")
    ) +
    sig(),
    unsubUrl
  );
}

function email1Text(prefsLink: string): string {
  return `Hi Doctor,

Quick overview of how BeyondRounds works:

1) Verified doctors only
We confirm membership privately to keep the community safe.

2) Small curated groups
You'll be placed in a small group based on your interests + availability.

3) Weekly waves, not spammy events
We open new matches in waves so people actually meet.

If you want us to match you better, tell us what you prefer:
Coffee / dinner / sports / walks
English / German
Typical free days

Set your preferences: ${prefsLink}

— Mostafa
Founder, BeyondRounds${textFooter()}`;
}

// ─── Email 2: One question ────────────────────────────────────────────────────

function email2Html(formLink: string, unsubUrl: string): string {
  return emailWrapper(
    p("Hi Doctor,") +
    p("One quick question:") +
    p("<strong>What's the biggest thing blocking you socially in Berlin right now?</strong>") +
    ctaBox(
      `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:2;">
        A) Unpredictable schedule<br>
        B) Don't know where to meet people<br>
        C) Too tired after work<br>
        D) Language barrier<br>
        E) Tried already, didn't work
      </p>` +
      btn(formLink, "Send your answer →")
    ) +
    p("This helps us build groups that actually work for doctors.") +
    sig(),
    unsubUrl
  );
}

function email2Text(formLink: string): string {
  return `Hi Doctor,

One quick question:

What's the biggest thing blocking you socially in Berlin right now?

A) Unpredictable schedule
B) Don't know where to meet people
C) Too tired after work
D) Language barrier
E) Tried already, didn't work

Tap one: ${formLink}

This helps us build groups that actually work for doctors.

— Mostafa
Founder, BeyondRounds${textFooter()}`;
}

// ─── Email 3: Referral push ───────────────────────────────────────────────────

function email3Html(referralLink: string, unsubUrl: string): string {
  return emailWrapper(
    p("Hi Doctor,") +
    p("We're opening BeyondRounds in small waves.") +
    p("If you want earlier access, here's the simplest way:") +
    p("<strong>Invite one doctor colleague to join the waitlist.</strong>") +
    ctaBox(
      `<p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Your personal link</p>
      <p style="margin:0 0 16px;font-size:14px;color:#3A0B22;word-break:break-all;font-family:monospace;">${referralLink}</p>` +
      btn(referralLink, "Share your link →")
    ) +
    p("When someone joins through your link, we move you up the queue.") +
    sig(),
    unsubUrl
  );
}

function email3Text(referralLink: string): string {
  return `Hi Doctor,

We're opening BeyondRounds in small waves.

If you want earlier access, here's the simplest way:

Invite one doctor colleague to join the waitlist.

Your personal link: ${referralLink}

When someone joins through it, we move you up the queue.

— Mostafa
Founder, BeyondRounds${textFooter()}`;
}

// ─── Email 4: Slots opening soon ─────────────────────────────────────────────

function email4Html(prefsLink: string, priorityLink: string, unsubUrl: string): string {
  return emailWrapper(
    p("Hi Doctor,") +
    p("We're close to starting matching in Berlin.") +
    p("To keep quality high, we'll invite people in waves:") +
    ul([
      "A limited number of new members per wave",
      "Priority goes to people who complete preferences + verification quickly",
    ]) +
    p("If you haven't done it yet, take 60 seconds:") +
    ctaBox(
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.8;">
        <a href="${prefsLink}" style="color:#3A0B22;font-weight:600;">→ Preferences</a>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.8;">
        <a href="${priorityLink}" style="color:#3A0B22;font-weight:600;">→ Priority access form</a>
      </p>`
    ) +
    sig(),
    unsubUrl
  );
}

function email4Text(prefsLink: string, priorityLink: string): string {
  return `Hi Doctor,

We're close to starting matching in Berlin.

To keep quality high, we'll invite people in waves:
- A limited number of new members per wave
- Priority goes to people who complete preferences + verification quickly

If you haven't done it yet, take 60 seconds:

Preferences: ${prefsLink}
Priority access form: ${priorityLink}

— Mostafa
Founder, BeyondRounds${textFooter()}`;
}

// ─── Weekly nurture ───────────────────────────────────────────────────────────

const WEEKLY_SUBJECTS = [
  "Quick update: Berlin wave is building",
  "We're adding more doctors before wave 1",
  "Matching starts soon — do this to get priority",
];

function weeklyHtml(
  referralLink: string,
  prefsLink: string,
  weekNum: number,
  unsubUrl: string
): string {
  const taglines = [
    "we're growing the Berlin list to make matching strong from day 1.",
    "more doctors are joining every day — matching will be better for it.",
    "we're finalising group sizes and neighbourhoods before opening.",
  ];
  const tagline = taglines[(weekNum - 1) % taglines.length];

  return emailWrapper(
    p("Hi Doctor,") +
    p(`Quick update: ${tagline}`) +
    p("If you want priority access, do these 2 things:") +
    ctaBox(
      `<p style="margin:0 0 14px;font-size:15px;line-height:1.8;">
        <a href="${prefsLink}" style="color:#3A0B22;font-weight:600;">1. Complete your preferences →</a>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.8;">
        <a href="${referralLink}" style="color:#3A0B22;font-weight:600;">2. Invite one colleague →</a>
      </p>`
    ) +
    p("That's it.") +
    sig(),
    unsubUrl
  );
}

function weeklyText(referralLink: string, prefsLink: string): string {
  return `Hi Doctor,

Quick update: we're growing the Berlin list to make matching strong from day 1.

If you want priority access, do these 2 things:

1. Complete your preferences: ${prefsLink}
2. Invite one colleague: ${referralLink}

That's it.

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
    // @ts-expect-error - Deno global is available at runtime
    const zeptoFrom = Deno.env.get("ZOHO_FROM_WAITLIST") ?? "waitlist@beyondrounds.app";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const appUrl = (Deno.env.get("APP_URL") ?? "https://app.beyondrounds.app").replace(/\/$/, "");

    if (!zeptoApiKey) throw new Error("Missing ZOHO_API_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("📧 Starting drip email sequence...");

    const { data: members, error: queryError } = await supabase
      .from("waitlist")
      .select("id, email, drip_count, last_drip_sent_at, created_at, unsubscribed_at")
      .is("unsubscribed_at", null)
      .order("created_at", { ascending: true });

    if (queryError) throw queryError;

    let sent = 0;
    let skipped = 0;

    for (const member of (members as WaitlistMember[]) ?? []) {
      try {
        if (!isDue(member)) {
          skipped++;
          continue;
        }

        const step = member.drip_count;

        // Build per-member links
        const emailSlug = encodeURIComponent(member.email);
        const referralLink = `https://beyondrounds.app/?ref=${emailSlug}`;
        const prefsLink = `${appUrl}/en/quiz`;
        const priorityLink = `${appUrl}/en/waitlist`;
        const feedbackLink = `${appUrl}/en/feedback?q=social_blocker&from=${emailSlug}`;
        const unsubUrl = `${appUrl}/unsubscribe?email=${emailSlug}`;

        let subject: string;
        let html: string;
        let text: string;

        if (step === 0) {
          subject = "How matching will work (in plain English)";
          html = email1Html(prefsLink, unsubUrl);
          text = email1Text(prefsLink);
        } else if (step === 1) {
          subject = "One question so we match you correctly";
          html = email2Html(feedbackLink, unsubUrl);
          text = email2Text(feedbackLink);
        } else if (step === 2) {
          subject = "Want earlier access? Bring one doctor with you";
          html = email3Html(referralLink, unsubUrl);
          text = email3Text(referralLink);
        } else if (step === 3) {
          subject = "Berlin matching starts soon — here's how invites work";
          html = email4Html(prefsLink, priorityLink, unsubUrl);
          text = email4Text(prefsLink, priorityLink);
        } else {
          // Weekly nurture — cycles through 3 subject lines
          const weekNum = step - 3; // 1, 2, 3, ...
          subject = WEEKLY_SUBJECTS[(weekNum - 1) % WEEKLY_SUBJECTS.length];
          html = weeklyHtml(referralLink, prefsLink, weekNum, unsubUrl);
          text = weeklyText(referralLink, prefsLink);
        }

        await sendViaZeptoMail({
          apiKey: zeptoApiKey,
          from: zeptoFrom,
          to: member.email,
          subject,
          html,
          text,
          unsubUrl,
        });

        const { error: updateError } = await supabase
          .from("waitlist")
          .update({
            last_drip_sent_at: new Date().toISOString(),
            drip_count: step + 1,
          })
          .eq("id", member.id);

        if (updateError) {
          console.error(`⚠️ Failed to update tracking for ${member.email}:`, updateError);
        }

        sent++;
        console.log(`✅ Email ${step + 1} (step ${step}) → ${member.email}`);
      } catch (memberError) {
        console.error(`❌ Failed for ${member.email}:`, memberError);
        skipped++;
      }
    }

    console.log(`📧 Done: ${sent} sent, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ success: true, sent, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ Error in send-drip-emails:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
