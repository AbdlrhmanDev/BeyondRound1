/**
 * RLS audit — verifies Row-Level Security is enabled on every user-data table.
 *
 * Usage:
 *   node scripts/check-rls.mjs
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
} catch { /* .env.local not present — rely on actual env vars */ }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Optional — get from: https://supabase.com/dashboard/account/tokens
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !serviceKey) {
  console.error('❌  Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
  process.exit(1);
}

// Extract project ref from URL: https://{ref}.supabase.co
const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

// Tables that must have RLS enabled
const REQUIRED_TABLES = [
  'profiles',
  'bookings',
  'match_groups',
  'group_members',
  'group_conversations',
  'subscriptions',
  'notifications',
  'user_roles',
  'onboarding_preferences',
];

function printResults(tables) {
  const noRLS    = [];
  const hasRLS   = [];
  const notFound = [];

  for (const tableName of REQUIRED_TABLES) {
    const table = tables.find(t => t.name === tableName && t.schema === 'public');
    if (!table)             notFound.push(tableName);
    else if (!table.rls_enabled) noRLS.push(tableName);
    else                    hasRLS.push(tableName);
  }

  if (hasRLS.length > 0) {
    console.log('✅  RLS enabled:');
    hasRLS.forEach(t => console.log(`   - ${t}`));
  }
  if (notFound.length > 0) {
    console.warn('\n⚠️  Tables not found in public schema (check name):');
    notFound.forEach(t => console.warn(`   - ${t}`));
  }
  if (noRLS.length > 0) {
    console.error('\n❌  RLS NOT enabled — fix immediately:');
    noRLS.forEach(t => console.error(`   - ${t}`));
    console.error('\nIn Supabase dashboard: Table Editor → select table → Enable RLS\n');
    process.exit(1);
  }
  if (noRLS.length === 0 && notFound.length === 0) {
    console.log('\n✅  All required tables have RLS enabled.\n');
  }
}

async function checkRLS() {
  // ── Strategy 1: Management API SQL query (works on Supabase Cloud) ────────
  if (accessToken) {
    console.log('\nChecking RLS via Supabase Management API...\n');
    const sql = `SELECT tablename AS name, rowsecurity AS rls_enabled FROM pg_tables WHERE schemaname = 'public'`;
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
      }
    );
    if (res.ok) {
      const rows = await res.json(); // [{ name, rls_enabled }, ...]
      // Normalise: Management API returns rows directly as an array
      const tables = rows.map(r => ({ name: r.name, schema: 'public', rls_enabled: r.rls_enabled }));
      printResults(tables);
      return;
    }
    const errText = await res.text();
    console.warn(`⚠️  Management API returned ${res.status}: ${errText}\n`);
  }

  // ── Strategy 2: pg-meta (works on self-hosted Supabase) ──────────────────
  console.log('Checking RLS via pg-meta...\n');
  const pgRes = await fetch(
    `${supabaseUrl.replace(/\/rest\/v1\/?$/, '')}/pg/tables?schema=public`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  if (pgRes.ok) {
    printResults(await pgRes.json());
    return;
  }

  // ── Strategy 3: manual checklist ─────────────────────────────────────────
  console.warn('⚠️  Cannot reach Supabase APIs automatically.\n');
  console.log('Manually verify: Supabase dashboard → Table Editor → each table → RLS toggle.\n');
  console.log('Tables to check:');
  REQUIRED_TABLES.forEach(t => console.log(`  - ${t}`));
}

checkRLS().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
