#!/usr/bin/env node
/**
 * scripts/setup-brevo.mjs
 *
 * Bootstraps the entire Brevo marketing setup for BeyondRounds in one run:
 *   1. Creates contact attributes  (FIRSTNAME, LOCALE)
 *   2. Creates the Waitlist Drip contact list
 *   3. Creates all 5 email templates  (D+2, D+5, D+10, D+14, Weekly)
 *   4. Prints all IDs + copy-pasteable automation instructions
 *
 * Run:
 *   node scripts/setup-brevo.mjs
 *
 * Requires BREVO_API_KEY in .env.local (already set).
 * Safe to re-run — existing attributes and templates are skipped, not duplicated.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env.local ──────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
} catch {
  console.warn('⚠️  Could not read .env.local — make sure BREVO_API_KEY is set in environment');
}

// Brevo API keys are sometimes stored as base64-encoded JSON: {"api_key":"xkeysib-..."}
// This unwraps that format automatically, falling back to the raw value.
function resolveBrevoKey(raw) {
  if (!raw) return null;
  try {
    const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    if (decoded?.api_key) return decoded.api_key;
  } catch { /* not base64 JSON — use as-is */ }
  return raw;
}

const API_KEY = resolveBrevoKey(process.env.BREVO_API_KEY);
if (!API_KEY) {
  console.error('❌  BREVO_API_KEY is not set. Add it to .env.local and retry.');
  process.exit(1);
}

// Stream 2 sender — must be a verified address under news.beyondrounds.app in Brevo
const SENDER_EMAIL = process.env.BREVO_FROM ?? 'updates@news.beyondrounds.app';
const BASE = 'https://api.brevo.com/v3';

// ─── API helper ───────────────────────────────────────────────────────────────
async function brevo(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'api-key': API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  return { status: res.status, data };
}

// ─── Shared HTML blocks ───────────────────────────────────────────────────────
const HEADER = `
  <tr>
    <td style="background:#3A0B22;padding:20px 32px;">
      <span style="color:#ffffff;font-size:14px;font-weight:600;letter-spacing:0.05em;font-family:Arial,Helvetica,sans-serif;">
        BeyondRounds
      </span>
    </td>
  </tr>`;

const FOOTER = `
  <tr>
    <td style="padding:20px 36px;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        {% if contact.LOCALE == "DE" %}
          Sie erhalten diese E-Mail, weil Sie sich auf der BeyondRounds Early-Access-Liste angemeldet haben.
          <a href="{{ unsubscribe }}" style="color:#9ca3af;text-decoration:underline;">Abmelden</a>
        {% else %}
          You received this because you joined the BeyondRounds early access list.
          <a href="{{ unsubscribe }}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
        {% endif %}
      </p>
    </td>
  </tr>`;

function layout(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table cellpadding="0" cellspacing="0" border="0"
             style="max-width:580px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        ${HEADER}
        <tr><td style="padding:32px 36px;">${body}</td></tr>
        ${FOOTER}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// Safe greeting helpers — avoids | default() filter which Brevo's parser rejects
const GREETING_HEY  = `<p style="margin:0 0 16px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">Hey {% if contact.FIRSTNAME %}{{ contact.FIRSTNAME }}{% endif %},</p>`;
const GREETING_HIDR = `<p style="margin:0 0 16px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">{% if contact.LOCALE == "DE" %}Hallo {% if contact.FIRSTNAME %}{{ contact.FIRSTNAME }}{% else %}Doktor{% endif %}{% else %}Hi {% if contact.FIRSTNAME %}{{ contact.FIRSTNAME }}{% else %}Doctor{% endif %}{% endif %},</p>`;

// ─── Shared partials ──────────────────────────────────────────────────────────
// urlEN is used for both languages — Brevo template parser rejects {% if %} in href attributes.
// All CTA URLs are language-agnostic (same checkout/app link); only label text differs.
function ctaButton(urlEN, _urlDE, labelEN, labelDE) {
  return `
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
  <tr>
    <td style="border-radius:6px;background:#3A0B22;">
      <a href="${urlEN}"
         style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,Helvetica,sans-serif;">
        {% if contact.LOCALE == "DE" %}${labelDE}{% else %}${labelEN}{% endif %}
      </a>
    </td>
  </tr>
</table>`;
}

function accentBox(contentEN, contentDE) {
  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr>
    <td style="background:#fdf2f8;border-left:3px solid #3A0B22;border-radius:0 6px 6px 0;padding:20px 24px;">
      <p style="margin:0;font-size:15px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
        {% if contact.LOCALE == "DE" %}${contentDE}{% else %}${contentEN}{% endif %}
      </p>
    </td>
  </tr>
</table>`;
}

function p(en, de, style = '') {
  const s = style || 'margin:0 0 16px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;';
  return `<p style="${s}">{% if contact.LOCALE == "DE" %}${de}{% else %}${en}{% endif %}</p>`;
}

function label(en, de) {
  return `<p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">{% if contact.LOCALE == "DE" %}${de}{% else %}${en}{% endif %}</p>`;
}

const CHECKOUT_URL   = 'https://checkout.beyondrounds.app/b/9B68wQfvz275ft23sqbo404';
const APP_URL        = 'https://app.beyondrounds.app/en/auth';
const ONBOARDING_URL = 'https://app.beyondrounds.app/en/onboarding';
const SITE_URL       = 'https://www.beyondrounds.app';

// ─── Template 0: D+0 — Immediate Welcome ─────────────────────────────────────
const T_WELCOME = layout(`
  ${GREETING_HEY}
  ${p(
    "Welcome — you're on the BeyondRounds list.",
    'Willkommen — Sie sind auf der BeyondRounds-Liste.',
    'margin:0 0 16px;font-size:16px;font-weight:600;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;'
  )}
  ${p(
    'BeyondRounds is a Berlin community for physicians. We send invites in small batches to keep matching quality high.',
    'BeyondRounds ist eine Community für Ärzte in Berlin. Wir versenden Einladungen in kleinen Gruppen, um die Qualität der Matches hoch zu halten.'
  )}

  ${label("WHAT HAPPENS NEXT:", "WAS ALS NÄCHSTES PASSIERT:")}
  ${p('1. We\'ll email you when an invite is ready.', '1. Wir informieren Sie, wenn eine Einladung bereit ist.',
    'margin:0 0 4px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  ${p('2. Short verification (private, takes a minute).', '2. Kurze Verifizierung (privat, dauert eine Minute).',
    'margin:0 0 4px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  ${p('3. We\'ll share your first match group.', '3. Wir stellen Ihnen Ihre erste Match-Gruppe vor.',
    'margin:0 0 32px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}

  <p style="margin:0;font-size:16px;color:#374151;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">— Mostafa<br>
  <span style="font-size:13px;color:#6b7280;">{% if contact.LOCALE == "DE" %}Gründer, BeyondRounds{% else %}Founder, BeyondRounds{% endif %}</span></p>
`);

// ─── Template 1: D+3 — Founding Member Offer ─────────────────────────────────
const T_FOUNDING = layout(`
  ${GREETING_HEY}
  ${p('Quick update from the BeyondRounds waitlist.', 'Ein kurzes Update von der BeyondRounds-Warteliste.',
    'margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  ${p("You're one of the first 100 doctors on our list.", 'Sie gehören zu den ersten 100 Ärzten auf unserer Liste.')}
  ${p('That means you qualify for founding member pricing:', 'Das bedeutet, Sie qualifizieren sich für den Gründungspreis:')}

  <!-- Price highlight -->
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
    <tr>
      <td style="background:#fdf2f8;border-left:3px solid #3A0B22;border-radius:0 6px 6px 0;padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:30px;font-weight:700;color:#3A0B22;line-height:1.2;font-family:Arial,Helvetica,sans-serif;">
          {% if contact.LOCALE == "DE" %}€9,99/Monat{% else %}€9.99/month{% endif %}
        </p>
        <p style="margin:0;font-size:12px;font-weight:700;color:#374151;letter-spacing:0.08em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">
          {% if contact.LOCALE == "DE" %}— FÜR IMMER GESPERRT{% else %}— LOCKED FOREVER{% endif %}
        </p>
      </td>
    </tr>
  </table>

  ${p(
    'Not "for 6 months" or "introductory rate." Forever. While everyone who joins after launch pays €19.99/month, you\'ll pay €9.99 for as long as you\'re a member.',
    'Nicht „für 6 Monate" oder „Einführungspreis". Für immer. Während alle nach dem Launch €19,99/Monat zahlen, zahlen Sie €9,99 — so lange Sie Mitglied sind.'
  )}

  ${label('WHY WE\'RE DOING THIS:', 'WARUM WIR DAS TUN:')}
  ${p(
    "You're betting on us before we're proven. We're rewarding that with a lifetime rate.",
    'Sie wetten auf uns, bevor wir etwas bewiesen haben. Wir belohnen das mit einem lebenslangen Preis.',
    'margin:0 0 24px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;'
  )}

  ${label('FOUNDING MEMBER BENEFITS:', 'VORTEILE ALS GRÜNDUNGSMITGLIED:')}
  ${p('✓ €9.99/month forever (locked rate)', '✓ €9,99/Monat für immer (gesperrter Preis)', 'margin:0 0 4px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  ${p('✓ Priority matching (first access to weekly matches)', '✓ Prioritäts-Matching (erster Zugang zu wöchentlichen Matches)', 'margin:0 0 4px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  ${p('✓ First access when we launch in new cities', '✓ Erster Zugang bei Expansion in neue Städte', 'margin:0 0 4px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  ${p('✓ Vote on new features', '✓ Abstimmung über neue Features', 'margin:0 0 4px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  ${p('✓ Early access to all new features', '✓ Früher Zugang zu allen neuen Features', 'margin:0 0 24px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}

  ${label('READY TO LOCK IN YOUR RATE?', 'BEREIT, IHREN PREIS ZU SICHERN?')}
  ${ctaButton(CHECKOUT_URL, CHECKOUT_URL, 'Secure Your Founding Rate — €9.99/Month', 'Gründungspreis sichern — €9,99/Monat')}

  ${p(
    "This link stays active until launch (March 31). After that, it's €19.99/month for everyone else.",
    'Dieser Link ist bis zum Launch aktiv (31. März). Danach zahlen alle €19,99/Monat.',
    'margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7;font-family:Arial,Helvetica,sans-serif;'
  )}

  ${label('THE GUARANTEE:', 'DIE GARANTIE:')}
  ${p(
    "If you don't meet up with at least ONE group in your first 30 days, choose: full refund or extra month free. You don't lose if this doesn't work.",
    'Wenn Sie sich in Ihren ersten 30 Tagen nicht mit mindestens EINER Gruppe treffen, wählen Sie: volle Rückerstattung oder ein zusätzlicher Monat gratis.',
    'margin:0 0 32px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;'
  )}

  <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">— Mostafa</p>
  ${p(
    "P.S. Not ready yet? No pressure. You can wait until launch and pay regular price (€19.99/month). But if you know you want this, lock in €9.99 now.",
    'P.S. Noch nicht bereit? Kein Druck. Aber wenn Sie das wollen, sichern Sie sich jetzt €9,99.',
    'margin:0;font-size:14px;color:#6b7280;font-style:italic;line-height:1.7;font-family:Arial,Helvetica,sans-serif;'
  )}
`);

// ─── Template 2: D+5 — Founder Story ─────────────────────────────────────────
const T_STORY = layout(`
  ${GREETING_HEY}
  ${p('Quick story.', 'Eine kurze Geschichte.',
    'margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  ${p('Last week, I ran into a colleague at the hospital café.', 'Letzte Woche bin ich einem Kollegen in der Krankenhauscafeteria begegnet.')}
  ${p("We've worked together for 8 months.", 'Wir arbeiten seit 8 Monaten zusammen.')}
  ${p('He said: "Hey, we should grab coffee sometime outside work."', 'Er sagte: „Hey, wir sollten mal außerhalb der Arbeit einen Kaffee trinken gehen."')}
  ${p('I said: "Yeah, definitely."', 'Ich sagte: „Ja, auf jeden Fall."')}
  ${p('Neither of us followed up.', 'Keiner von uns hat nachgefasst.',
    'margin:0 0 24px;font-size:16px;font-weight:600;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}

  ${label('WHY?', 'WARUM?')}
  ${p("Not because we don't want to. But because:", 'Nicht weil wir es nicht wollen. Sondern weil:')}
  ${p('→ Our schedules never align', '→ Unsere Pläne stimmen nie überein',
    'margin:0 0 4px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  ${p("→ We don't have a system for making it happen", '→ Wir haben kein System, um es umzusetzen',
    'margin:0 0 4px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  ${p('→ "We should hang out" always stays "we should"', '→ „Wir sollten uns treffen" bleibt immer nur „wir sollten"',
    'margin:0 0 24px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}

  ${p("This is why I'm building BeyondRounds.", 'Deshalb baue ich BeyondRounds.')}

  ${accentBox(
    'To turn "we should" into "we did."',
    'Um aus „wir sollten" ein „wir haben" zu machen.'
  )}

  ${label('THE UPDATE:', 'DAS UPDATE:')}
  ${p(
    'We\'re in the final stretch before launch. The waitlist is filling up with doctors who feel the same way — ready to stop hoping friendships "just happen" and start making them happen.',
    'Wir sind in der Schlussphase vor dem Launch. Die Warteliste füllt sich mit Ärzten, die genauso denken — bereit, aufzuhören zu hoffen, dass Freundschaften „einfach so entstehen".',
  )}
  ${p("You're part of the founding group.", 'Sie sind Teil der Gründungsgruppe.')}
  ${p("If you haven't yet, secure your founder offer now!", 'Wenn Sie es noch nicht getan haben, sichern Sie sich jetzt Ihr Gründer-Angebot!',
    'margin:0 0 20px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}

  ${ctaButton(CHECKOUT_URL, CHECKOUT_URL, 'Secure Your Founding Rate — €9.99/Month', 'Gründungspreis sichern — €9,99/Monat')}

  <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">— Mostafa</p>
  ${p(
    'P.S. Forward this to a colleague who needs it.',
    'P.S. Leite das an einen Kollegen weiter, dem das genauso geht.',
    'margin:0;font-size:14px;color:#6b7280;font-style:italic;line-height:1.7;font-family:Arial,Helvetica,sans-serif;'
  )}
`);

// ─── Template 3: D+10 — Slots Opening Soon ───────────────────────────────────
const T_SLOTS = layout(`
  ${GREETING_HIDR}
  ${p("We're close to starting matching in Berlin.", 'Wir sind kurz davor, das Matching in Berlin zu starten.')}
  ${p("To keep quality high, we'll invite people in waves:", 'Um die Qualität hoch zu halten, laden wir Menschen in Wellen ein:')}

  ${accentBox(
    '• A limited number of new members per wave<br>• Priority goes to people who complete verification quickly',
    '• Eine begrenzte Anzahl neuer Mitglieder pro Welle<br>• Priorität haben Personen, die die Verifizierung schnell abschließen'
  )}

  ${p(
    'Secure your spot now — launch is in a few days.',
    'Sichern Sie Ihren Platz jetzt — der Launch ist in wenigen Tagen.',
    'margin:0 0 24px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;'
  )}

  ${ctaButton(CHECKOUT_URL, CHECKOUT_URL, 'Secure Your Founding Rate — €9.99/Month', 'Gründungspreis sichern — €9,99/Monat')}

  <p style="margin:0;font-size:16px;color:#374151;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">— Mostafa</p>
`);

// ─── Template 4: D+14 — Launch Day ───────────────────────────────────────────
// btnUrlEN used for both languages — see ctaButton note above.
function stepBox(stepEN, stepDE, contentEN, contentDE, btnUrlEN, _btnUrlDE, btnEN, btnDE) {
  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 10px;">
  <tr>
    <td style="background:#fdf2f8;border-left:3px solid #3A0B22;border-radius:0 6px 6px 0;padding:18px 22px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">
        {% if contact.LOCALE == "DE" %}${stepDE}{% else %}${stepEN}{% endif %}
      </p>
      <p style="margin:0${btnEN ? ' 0 14px' : ''};font-size:14px;color:#374151;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
        {% if contact.LOCALE == "DE" %}${contentDE}{% else %}${contentEN}{% endif %}
      </p>
      ${btnEN ? `
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:6px;background:#3A0B22;">
            <a href="${btnUrlEN}"
               style="display:inline-block;padding:10px 18px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,Helvetica,sans-serif;">
              {% if contact.LOCALE == "DE" %}${btnDE}{% else %}${btnEN}{% endif %}
            </a>
          </td>
        </tr>
      </table>` : ''}
    </td>
  </tr>
</table>`;
}

const T_LAUNCH = layout(`
  ${GREETING_HEY}
  <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1f2937;line-height:1.3;font-family:Arial,Helvetica,sans-serif;">
    {% if contact.LOCALE == "DE" %}Es passiert.{% else %}It's happening.{% endif %}
  </p>
  ${p('BeyondRounds officially launches TODAY.', 'BeyondRounds startet HEUTE offiziell.')}

  ${label('WHAT THIS MEANS FOR YOU:', 'WAS DAS FÜR SIE BEDEUTET:')}
  <p style="margin:0 0 24px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
    {% if contact.LOCALE == "DE" %}Die Website ist live:{% else %}The website is live:{% endif %}
    <a href="${SITE_URL}" style="color:#3A0B22;text-decoration:underline;">${SITE_URL}</a>
  </p>
  ${p("Here's what you do now:", 'So geht es weiter:')}

  ${stepBox(
    'STEP 1: CREATE YOUR ACCOUNT', 'SCHRITT 1: KONTO ERSTELLEN',
    '→ Your interests (what you like to do)<br>→ Your availability (when you\'re free)<br>→ Your location in Berlin<br>→ A bit about yourself',
    '→ Ihre Interessen (was Sie gerne tun)<br>→ Ihre Verfügbarkeit (wann Sie frei sind)<br>→ Ihr Standort in Berlin<br>→ Ein bisschen über Sie',
    ONBOARDING_URL, ONBOARDING_URL,
    'Complete Your Profile — 5 Minutes', 'Profil vervollständigen — 5 Minuten'
  )}

  ${stepBox(
    "STEP 2: VERIFY YOU'RE A DOCTOR", 'SCHRITT 2: ALS ARZT VERIFIZIEREN',
    '→ Medical license, OR<br>→ Hospital ID, OR<br>→ Proof of medical registration<br><span style="color:#9ca3af;font-size:12px;">(Keeps the community 100% doctors only)</span>',
    '→ Approbationsurkunde, ODER<br>→ Krankenhaus-Ausweis, ODER<br>→ Nachweis der ärztlichen Registrierung<br><span style="color:#9ca3af;font-size:12px;">(Hält die Community zu 100% für Ärzte)</span>',
    null, null, null, null
  )}

  ${stepBox(
    'STEP 3: LOCK IN YOUR FOUNDING RATE', 'SCHRITT 3: GRÜNDUNGSPREIS SICHERN',
    '€9.99/month forever (if you want it)<br><span style="color:#9ca3af;">Regular price after today: €19.99/month</span>',
    '€9,99/Monat für immer (wenn Sie möchten)<br><span style="color:#9ca3af;">Regulärer Preis ab heute: €19,99/Monat</span>',
    CHECKOUT_URL, CHECKOUT_URL,
    'Secure Founding Rate — €9.99/Month', 'Gründungspreis sichern — €9,99/Monat'
  )}

  ${stepBox(
    'STEP 4: GET MATCHED', 'SCHRITT 4: GEMATCHT WERDEN',
    "March 17 at 5 PM — first matches go out.<br>You'll meet 3–4 doctors who share your interests.",
    '17. März um 17:00 Uhr — erste Matches werden verschickt.<br>Sie treffen 3–4 Ärzte mit Ihren Interessen.',
    null, null, null, null
  )}

  <!-- Big CTA -->
  <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:6px;background:#3A0B22;">
        <a href="${ONBOARDING_URL}" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,Helvetica,sans-serif;">
          {% if contact.LOCALE == "DE" %}Jetzt loslegen — 5 Minuten{% else %}Get Started Now — 5 Minutes{% endif %}
        </a>
      </td>
    </tr>
  </table>

  ${p(
    'Questions? Reply to this email or DM us on Instagram.',
    'Fragen? Antworten Sie auf diese E-Mail oder schreiben Sie uns auf Instagram.',
    'margin:0 0 32px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;'
  )}
  <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">— Mostafa</p>
  <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 20px;">
  ${p(
    "P.S. Already secured your founding rate? Log in and complete your profile. That's all you need to do.",
    'P.S. Haben Sie bereits Ihren Gründungspreis gesichert? Melden Sie sich an und vervollständigen Sie Ihr Profil.',
    'margin:0;font-size:14px;color:#6b7280;font-style:italic;line-height:1.7;font-family:Arial,Helvetica,sans-serif;'
  )}
`);

// ─── Template 5: Weekly Nurture ───────────────────────────────────────────────
const T_WEEKLY = layout(`
  ${GREETING_HIDR}
  ${p(
    "Quick update: we're growing the Berlin list to make matching strong from day 1.",
    'Kurzes Update: Wir wachsen die Berliner Liste, damit das Matching von Anfang an stark ist.'
  )}
  ${p(
    'If you want priority access, do these 2 things:',
    'Wenn Sie Priority Access möchten, tun Sie diese 2 Dinge:'
  )}

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
    <tr>
      <td style="background:#fdf2f8;border-left:3px solid #3A0B22;border-radius:0 6px 6px 0;padding:20px 24px;">
        <p style="margin:0 0 12px;font-size:16px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
          <a href="${APP_URL}" style="color:#3A0B22;font-weight:600;text-decoration:none;">
            {% if contact.LOCALE == "DE" %}1. Profil vervollständigen →{% else %}1. Complete your profile →{% endif %}
          </a>
        </p>
        <p style="margin:0;font-size:16px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
          <a href="https://www.beyondrounds.app/waitlist" style="color:#3A0B22;font-weight:600;text-decoration:none;">
            {% if contact.LOCALE == "DE" %}2. Einen Kollegen einladen →{% else %}2. Invite one colleague →{% endif %}
          </a>
        </p>
      </td>
    </tr>
  </table>

  ${p("That's it.", 'Das war es.',
    'margin:0 0 32px;font-size:16px;color:#1f2937;line-height:1.7;font-family:Arial,Helvetica,sans-serif;')}
  <p style="margin:0;font-size:16px;color:#374151;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">— Mostafa</p>
`);

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  BeyondRounds — Brevo Setup\n' + '─'.repeat(56));
  const ids = {};

  // 1. Contact attributes
  console.log('\n1️⃣   Contact attributes');
  for (const attr of ['FIRSTNAME', 'LOCALE']) {
    const { status } = await brevo('POST', `/contacts/attributes/normal/${attr}`, { type: 'text' });
    if (status === 201)      console.log(`     ✅  ${attr} created`);
    else if (status === 400) console.log(`     ↩️   ${attr} already exists`);
    else                     console.warn(`     ⚠️   ${attr} unexpected status ${status}`);
  }

  // 2. Contact list
  console.log('\n2️⃣   Contact list');
  const { status: ls, data: ld } = await brevo('POST', '/contacts/lists', {
    name: 'BeyondRounds Waitlist Drip',
    folderId: 1,
  });
  if (ls === 201) {
    ids.listId = ld.id;
    console.log(`     ✅  List created  → ID: ${ld.id}`);
  } else if (ls === 400 && ld?.code === 'duplicate_parameter') {
    console.log('     ↩️   List already exists. Find its ID in Brevo → Contacts → Lists');
  } else {
    console.warn('     ⚠️   List failed:', ld);
  }

  // 3. Email templates
  console.log('\n3️⃣   Email templates');
  const templates = [
    {
      key: 'welcome',
      name: 'BeyondRounds — D+0 Immediate Welcome',
      subject: '{% if contact.LOCALE == "DE" %}Willkommen bei BeyondRounds{% else %}Welcome to BeyondRounds{% endif %}',
      html: T_WELCOME,
    },
    {
      key: 'founding',
      name: 'BeyondRounds — D+3 Founding Member Offer',
      subject: '{% if contact.LOCALE == "DE" %}Ihr Gründungsmitglieds-Zugang (€9,99/Monat für immer){% else %}Your founding member access (€9.99/month forever){% endif %}',
      html: T_FOUNDING,
    },
    {
      key: 'story',
      name: 'BeyondRounds — D+5 Founder Story',
      subject: '{% if contact.LOCALE == "DE" %}Warum ich das aufbaue{% else %}Why I\'m building this{% endif %}',
      html: T_STORY,
    },
    {
      key: 'slots',
      name: 'BeyondRounds — D+7 Early Invite',
      subject: '{% if contact.LOCALE == "DE" %}Matching startet bald — sichern Sie Ihren Platz{% else %}Matching starts soon — secure your spot{% endif %}',
      html: T_SLOTS,
    },
    {
      key: 'launch',
      name: 'BeyondRounds — Launch Broadcast (send manually)',
      subject: '{% if contact.LOCALE == "DE" %}🎉 BeyondRounds ist live (Ihr Zugang){% else %}🎉 BeyondRounds is live (your access inside){% endif %}',
      html: T_LAUNCH,
    },
    {
      key: 'weekly',
      name: 'BeyondRounds — Weekly Nurture',
      subject: '{% if contact.LOCALE == "DE" %}Kurzes Update: Berliner Welle wächst{% else %}Quick update: Berlin wave is building{% endif %}',
      html: T_WEEKLY,
    },
  ];

  for (const tpl of templates) {
    const { status, data } = await brevo('POST', '/smtp/templates', {
      templateName: tpl.name,
      subject: tpl.subject,
      htmlContent: tpl.html,
      sender: { name: 'BeyondRounds Updates', email: SENDER_EMAIL },
      replyTo: 'mostafa@beyondrounds.app',
      isActive: true,
    });
    if (status === 201) {
      ids[tpl.key] = data.id;
      console.log(`     ✅  "${tpl.name}"  → Template ID: ${data.id}`);
    } else {
      console.warn(`     ⚠️   "${tpl.name}" failed (${status}):`, data?.message ?? JSON.stringify(data));
    }
  }

  // 4. Summary
  const div = '─'.repeat(56);
  console.log(`\n${div}`);
  console.log('✅  DONE\n');

  if (ids.listId) {
    console.log(`Add to .env.local (and production env):`);
    console.log(`  BREVO_LIST_ID=${ids.listId}\n`);
  }

  console.log('Template IDs created:');
  for (const [k, v] of Object.entries(ids)) {
    if (k !== 'listId') console.log(`  ${k.padEnd(10)} → ${v}`);
  }

  console.log(`
${div}
NEXT STEP — Build the automation in Brevo UI
(Automations cannot be created via API)
${div}

  Brevo → Automation → New workflow

  TRIGGER
    Contact is added to list "BeyondRounds Waitlist Drip"
    (List ID: ${ids.listId ?? 'see above'})

  STEP 0 — send immediately:
    Template: D+0 Immediate Welcome      (ID: ${ids.welcome ?? '?'})

  STEP 1 — wait 3 days, then send:
    Template: D+3 Founding Member Offer  (ID: ${ids.founding ?? '?'})

  STEP 2 — wait 2 more days (D+5 total), then send:
    Template: D+5 Founder Story          (ID: ${ids.story ?? '?'})

  STEP 3 — wait 2 more days (D+7 total), then send:
    Template: D+7 Early Invite           (ID: ${ids.slots ?? '?'})

  STEP 4 — wait 7 more days (D+14), then send:
    Template: Weekly Nurture             (ID: ${ids.weekly ?? '?'})
    ↳ Add "loop" condition: repeat every 7 days, max once per week, until unsubscribed

  LAUNCH BROADCAST — send manually as a Brevo campaign to the full list:
    Template: Launch Broadcast           (ID: ${ids.launch ?? '?'})
    ↳ Use Brevo → Campaigns → Email → Create a campaign
    ↳ Send on launch day to list "BeyondRounds Waitlist Drip"

${div}
SENDER DOMAIN — verify before going live
  Stream 2 sender: ${SENDER_EMAIL}  (from news.beyondrounds.app)
  SPF  :  add  include:spf.brevo.com  to news.beyondrounds.app SPF record
  DKIM :  add the CNAME Brevo provides under Settings → Senders → Domains
  Stream 1 (Resend transactional) sends from mail.beyondrounds.app separately
${div}
`);
}

main().catch((err) => {
  console.error('❌  Fatal:', err);
  process.exit(1);
});
