/**
 * Pre-flight env var check — run before deploying to production.
 *
 * Usage:
 *   node scripts/check-env.mjs
 *
 * Automatically loads .env.local if present (same directory as package.json).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try {
  const raw = readFileSync(resolve(root, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
} catch { /* .env.local not present — rely on actual env vars (CI / Vercel) */ }

const REQUIRED = [
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',

  // Stripe
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET_EMAILS',
  'NEXT_PUBLIC_STRIPE_PRICE_ID_ONE_TIME',
  'NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY',
  'NEXT_PUBLIC_STRIPE_PRICE_ID_THREE_MONTH',
  'NEXT_PUBLIC_STRIPE_PRICE_ID_SIX_MONTH',

  // Email — Resend (transactional)
  'RESEND_API_KEY',
  'EMAIL_BASE_URL',

  // Email — Brevo (marketing)
  'BREVO_API_KEY',
  'BREVO_LIST_ID',

  // Internal
  'INTERNAL_API_SECRET',
  'ADMIN_EMAIL',
];

const OPTIONAL = [
  // Analytics (safe to omit — scripts are no-ops without these)
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'NEXT_PUBLIC_META_PIXEL_ID',

  // Monitoring
  'NEXT_PUBLIC_SENTRY_DSN',

  // Brevo customisation
  'BREVO_FROM',

  // Resend customisation
  'RESEND_FROM',
];

// ─────────────────────────────────────────────────────────────────────────────

const missing = REQUIRED.filter(k => !process.env[k]);
const missingOpt = OPTIONAL.filter(k => !process.env[k]);

if (missingOpt.length > 0) {
  console.warn('\n⚠️  Optional env vars not set (features will be disabled):');
  missingOpt.forEach(k => console.warn(`   - ${k}`));
}

if (missing.length > 0) {
  console.error('\n❌  Missing REQUIRED env vars:');
  missing.forEach(k => console.error(`   - ${k}`));
  console.error('\nSet these in Vercel → Project → Settings → Environment Variables\n');
  process.exit(1);
}

console.log('\n✅  All required env vars are present.\n');
