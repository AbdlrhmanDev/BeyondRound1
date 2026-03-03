/**
 * BeyondRounds — Full System Test Seed
 * Creates 8 named test users, each at a different stage of the funnel.
 * Covers: auth, profiles, verification, subscriptions, events, bookings, groups, chat.
 *
 * Usage:
 *   node scripts/seed-test.mjs           # create test data
 *   node scripts/seed-test.mjs --clean   # wipe old test data first, then re-create
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const content = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
    const env = {};
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const [key, ...rest] = t.split('=');
      if (key) env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Constants ────────────────────────────────────────────────────────────────
const PASSWORD = 'Test1234!';
const DOMAIN   = 'test.beyondrounds.dev';

// ── Date helpers ─────────────────────────────────────────────────────────────
function nextThursday() {
  const d = new Date();
  const diff = (4 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function nextWeekendDay(day) {
  const targets = { friday: 5, saturday: 6, sunday: 0 };
  const d = new Date();
  let diff = (targets[day] - d.getDay() + 7) % 7;
  if (diff === 0) diff = 7;
  d.setDate(d.getDate() + diff);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

// ── Test user definitions ─────────────────────────────────────────────────────
//
//  stage               | What to test
//  ────────────────────|──────────────────────────────────────────────
//  admin               | Admin dashboard, verification, run-matching
//  in_group            | Group chat, matches, booking, subscription
//  verified_no_sub     | Payment flow — subscribe to unlock matching
//  pending_verify      | Admin approval flow — approve / reject docs
//  incomplete_profile  | Onboarding flow — fill profile
//  waitlist_only       | Waitlist signup — no app account yet
//
const TEST_USERS = [
  {
    n: 1,
    email: `admin@${DOMAIN}`,
    name: 'Admin User',
    gender: 'male',
    stage: 'admin',
    role: 'admin',
    verified: true,
    subscribed: false,
  },
  {
    n: 2,
    email: `dr.anna@${DOMAIN}`,
    name: 'Dr. Anna Founding',
    gender: 'female',
    stage: 'in_group',
    specialty: 'Cardiology',
    verified: true,
    subscribed: true,
    plan: 'monthly',
    founding: true,
  },
  {
    n: 3,
    email: `dr.max@${DOMAIN}`,
    name: 'Dr. Max Member',
    gender: 'male',
    stage: 'in_group',
    specialty: 'Neurology',
    verified: true,
    subscribed: true,
    plan: 'monthly',
    founding: false,
  },
  {
    n: 4,
    email: `dr.sara@${DOMAIN}`,
    name: 'Dr. Sara Group',
    gender: 'female',
    stage: 'in_group',
    specialty: 'Pediatrics',
    verified: true,
    subscribed: true,
    plan: 'monthly',
    founding: false,
  },
  {
    n: 5,
    email: `dr.leo@${DOMAIN}`,
    name: 'Dr. Leo Verified',
    gender: 'male',
    stage: 'verified_no_sub',
    specialty: 'Surgery',
    verified: true,
    subscribed: false,
  },
  {
    n: 6,
    email: `dr.mia@${DOMAIN}`,
    name: 'Dr. Mia Pending',
    gender: 'female',
    stage: 'pending_verify',
    specialty: 'Psychiatry',
    verified: false,
    subscribed: false,
  },
  {
    n: 7,
    email: `dr.tom@${DOMAIN}`,
    name: 'Dr. Tom New',
    gender: 'male',
    stage: 'incomplete_profile',
    verified: false,
    subscribed: false,
  },
  {
    n: 8,
    email: `waitlist@${DOMAIN}`,
    name: 'Jane Waitlist',
    gender: 'female',
    stage: 'waitlist_only',
    verified: false,
    subscribed: false,
    waitlistOnly: true,
  },
];

// ── Clean old test data ──────────────────────────────────────────────────────
async function clean() {
  console.log('🧹 Cleaning old test data...');

  // Find existing test auth users by email
  const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const testEmails = new Set(TEST_USERS.map(u => u.email));
  const testAuthUsers = (allUsers || []).filter(u => testEmails.has(u.email));
  const userIds = testAuthUsers.map(u => u.id);

  if (userIds.length > 0) {
    await supabase.from('group_members').delete().in('user_id', userIds);
    await supabase.from('matches').delete().in('user_id', userIds);
    await supabase.from('matches').delete().in('matched_user_id', userIds);
    await supabase.from('subscriptions').delete().in('user_id', userIds);
    await supabase.from('verification_requests').delete().in('user_id', userIds);
    await supabase.from('onboarding_preferences').delete().in('user_id', userIds);
    await supabase.from('user_roles').delete().in('user_id', userIds);
    await supabase.from('profiles').delete().in('user_id', userIds);
    for (const uid of userIds) await supabase.auth.admin.deleteUser(uid);
    console.log(`   Deleted ${userIds.length} auth users + related rows`);
  }

  // Clean test groups (by name prefix)
  const { data: groups } = await supabase
    .from('match_groups')
    .select('id')
    .like('name', 'Test Group%');

  if (groups?.length) {
    const gIds = groups.map(g => g.id);
    const { data: evts } = await supabase.from('events').select('id').in('group_id', gIds);
    if (evts?.length) {
      await supabase.from('bookings').delete().in('event_id', evts.map(e => e.id));
      await supabase.from('events').delete().in('id', evts.map(e => e.id));
    }
    await supabase.from('group_members').delete().in('group_id', gIds);
    await supabase.from('group_conversations').delete().in('group_id', gIds);
    await supabase.from('match_groups').delete().in('id', gIds);
    console.log(`   Deleted ${gIds.length} test groups + events + bookings`);
  }

  // Clean waitlist test entries
  await supabase.from('waitlist').delete().like('email', `%@${DOMAIN}`);

  console.log('   ✅ Clean complete\n');
}

// ── Create one user ──────────────────────────────────────────────────────────
async function createUser(u) {
  // ── Waitlist-only: just add to waitlist table, no auth account ────────────
  if (u.waitlistOnly) {
    const { error } = await supabase.from('waitlist').insert({ email: u.email });
    if (error) throw new Error(`Waitlist insert failed: ${error.message}`);
    return { ...u, userId: null };
  }

  // ── Auth user ─────────────────────────────────────────────────────────────
  const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.name },
  });
  if (authErr) throw new Error(`Auth: ${authErr.message}`);
  const userId = auth.user.id;

  // ── Profile ───────────────────────────────────────────────────────────────
  if (u.stage !== 'incomplete_profile') {
    const profile = {
      user_id: userId,
      full_name: u.name,
      city: 'Berlin',
      neighborhood: 'Mitte',
      gender: u.gender,
      date_of_birth: '1990-06-15',
      languages: ['English', 'German'],
      status: 'active',
    };
    if (u.verified) {
      profile.verified_at = new Date().toISOString();
      profile.verification_method = 'document';
    }
    const { error } = await supabase.from('profiles').upsert(profile, { onConflict: 'user_id' });
    if (error) throw new Error(`Profile: ${error.message}`);

    // ── Onboarding preferences ─────────────────────────────────────────────
    const { error: prefErr } = await supabase.from('onboarding_preferences').upsert({
      user_id: userId,
      specialty: u.specialty || 'General Practice',
      career_stage: 'attending_early',
      sports: ['running', 'cycling', 'hiking'],
      social_style: ['ambivert'],
      culture_interests: ['music', 'cinema', 'art'],
      lifestyle: ['active', 'balanced'],
      goals: ['friendship', 'activity_partners'],
      availability_slots: ['weekend_morning', 'weekend_evening', 'friday_morning'],
      open_to_business: false,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (prefErr) throw new Error(`Onboarding prefs: ${prefErr.message}`);
  } else {
    // Incomplete profile — just the bare minimum
    const { error } = await supabase.from('profiles').upsert({
      user_id: userId,
      full_name: u.name,
      city: 'Berlin',
      gender: u.gender,
      status: 'active',
    }, { onConflict: 'user_id' });
    if (error) throw new Error(`Profile (incomplete): ${error.message}`);
  }

  // ── Admin role ────────────────────────────────────────────────────────────
  if (u.role === 'admin') {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
    if (error) throw new Error(`User role: ${error.message}`);
  }

  // ── Subscription (fake Stripe IDs — safe for local testing) ──────────────
  if (u.subscribed) {
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    const { error } = await supabase.from('subscriptions').insert({
      user_id: userId,
      stripe_customer_id: `cus_test_seed_${u.n}`,
      stripe_subscription_id: `sub_test_seed_${u.n}`,
      stripe_price_id: 'price_test_seed',
      plan_name: u.plan,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
    });
    if (error) throw new Error(`Subscription: ${error.message}`);
  }

  // ── Pending verification request ──────────────────────────────────────────
  if (u.stage === 'pending_verify') {
    const { error } = await supabase.from('verification_requests').insert({
      user_id: userId,
      document_type: 'medical_license',
      file_url: 'https://placehold.co/600x400/png?text=Medical+License+(Test)',
      status: 'pending',
    });
    if (error) throw new Error(`Verification request: ${error.message}`);
  }

  return { ...u, userId };
}

// ── Create group + event + bookings ──────────────────────────────────────────
async function createGroupWithEvent(members) {
  const matchWeek = nextThursday();

  // Event first (so we can link group → event)
  const { data: evtPre, error: evtPreErr } = await supabase
    .from('events')
    .insert({
      city: 'Berlin',
      neighborhood: 'Mitte',
      meetup_type: 'dinner',
      date_time: nextWeekendDay('friday'),
      status: 'open',
      max_participants: 4,
      min_participants: 3,
    })
    .select('id')
    .single();
  if (evtPreErr) throw new Error(`Event: ${evtPreErr.message}`);

  // Group linked to event
  const { data: grp, error: grpErr } = await supabase
    .from('match_groups')
    .insert({
      name: 'Test Group — Berlin Friday',
      group_type: 'mixed',
      gender_composition: '2F1M',
      status: 'active',
      match_week: matchWeek,
      event_id: evtPre.id,
    })
    .select('id')
    .single();
  if (grpErr) throw new Error(`Group: ${grpErr.message}`);
  const groupId = grp.id;

  // Members
  const { error: memErr } = await supabase.from('group_members').insert(
    members.map(m => ({ group_id: groupId, user_id: m.userId }))
  );
  if (memErr) throw new Error(`Group members: ${memErr.message}`);

  // Group conversation (enables chat)
  const { error: convErr } = await supabase
    .from('group_conversations')
    .insert({ group_id: groupId });
  if (convErr) throw new Error(`Group conversation: ${convErr.message}`);

  // Bookings
  const { error: bookErr } = await supabase.from('bookings').insert(
    members.map(m => ({
      event_id: evtPre.id,
      user_id: m.userId,
      paid: true,
      status: 'confirmed',
      preferences: { day: 'friday' },
    }))
  );
  if (bookErr) throw new Error(`Bookings: ${bookErr.message}`);

  return { groupId, eventId: evtPre.id, matchWeek };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const doClean = process.argv.includes('--clean');

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  BeyondRounds — Full System Test Seed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  if (doClean) await clean();

  console.log('👤 Creating users...\n');
  const created = [];

  for (const u of TEST_USERS) {
    try {
      const result = await createUser(u);
      created.push(result);
      const icon =
        u.waitlistOnly ? '📧' :
        u.role === 'admin' ? '🔑' :
        u.stage === 'in_group' ? '✅' :
        u.stage === 'verified_no_sub' ? '🔵' :
        u.stage === 'pending_verify' ? '⏳' :
        '⚪';
      console.log(`  ${icon}  [${u.n}] ${u.name}`);
      console.log(`        ${u.email}`);
      console.log(`        Stage: ${u.stage}\n`);
    } catch (err) {
      console.error(`  ❌  [${u.n}] ${u.name} FAILED: ${err.message}\n`);
    }
  }

  // Group + event + bookings
  const groupMembers = created.filter(u => u.stage === 'in_group' && u.userId);
  let groupResult = null;
  if (groupMembers.length >= 2) {
    console.log('👥 Creating group + event + bookings...');
    try {
      groupResult = await createGroupWithEvent(groupMembers);
      console.log(`   ✅ Group created  (match_week: ${groupResult.matchWeek})`);
      console.log(`   ✅ Event created  (Friday ${nextWeekendDay('friday').split('T')[0]})`);
      console.log(`   ✅ Bookings       (${groupMembers.length} members confirmed)`);
      console.log(`   ✅ Chat enabled   (group_conversations created)\n`);
    } catch (err) {
      console.error(`   ❌ Group/event failed: ${err.message}\n`);
    }
  }

  // ── Print credentials table ───────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📋  CREDENTIALS  (password for all: ' + PASSWORD + ')');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const descriptions = {
    admin:             '🔑 Admin — full dashboard access',
    in_group:          '✅ Verified + subscribed + in a group (test chat)',
    verified_no_sub:   '🔵 Verified + no subscription  → test payment flow',
    pending_verify:    '⏳ Docs uploaded, awaiting admin approval',
    incomplete_profile:'⚪ Signed up — profile not filled yet',
    waitlist_only:     '📧 Waitlist only — no app account (sign up manually)',
  };

  for (const u of TEST_USERS) {
    console.log(`  [${u.n}]  ${u.email}`);
    console.log(`        ${descriptions[u.stage] || u.stage}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  💡  WHAT TO TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('  PAYMENT');
  console.log('    1. Log in as User 5  (dr.leo) — verified, no subscription');
  console.log('    2. Go to Pricing → subscribe');
  console.log('    3. Use Stripe test card: 4242 4242 4242 4242');
  console.log('    4. Check subscription_started email arrives\n');
  console.log('  VERIFICATION (admin flow)');
  console.log('    1. Log in as User 1  (admin) → Admin → Verification');
  console.log('    2. Find User 6 (dr.mia) — pending docs');
  console.log('    3. Approve or reject → check email sent\n');
  console.log('  GROUP CHAT');
  console.log('    1. Log in as User 2, 3, or 4  (dr.anna / dr.max / dr.sara)');
  console.log('    2. Go to Matches → open group chat');
  console.log('    3. Send messages — confirm real-time between tabs\n');
  console.log('  MATCHING (run algorithm)');
  console.log('    1. Log in as admin → open browser console');
  console.log('    2. POST /api/admin/run-matching  (or use Admin → Matches → Run)');
  console.log('    3. New groups created from booked users\n');
  console.log('  STRIPE WEBHOOKS (local)');
  console.log('    stripe listen --forward-to localhost:3000/api/webhooks/stripe\n');
  console.log('  ONBOARDING');
  console.log('    Log in as User 7 (dr.tom) — profile is empty, walk through onboarding\n');
  console.log('  WAITLIST EMAIL FLOW');
  console.log('    Sign up at /waitlist with waitlist@test.beyondrounds.dev');
  console.log('    Check Brevo automation fires (BREVO_LIST_ID must be set)\n');
  console.log('  RE-SEED');
  console.log('    node scripts/seed-test.mjs --clean\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('\n💥 Seed failed:', err.message);
  process.exit(1);
});
