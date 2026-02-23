const { createClient } = require('@supabase/supabase-js');
const { readFileSync }  = require('fs');
const { join }          = require('path');

// ── Env ─────────────────────────────────────────────────────────────────────
// __dirname is available in CJS automatically

function loadEnvFile() {
  try {
    const content = readFileSync(join(__dirname, '.env.local'), 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      const [key, ...rest] = t.split('=');
      if (key) env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    });
    return env;
  } catch { return {}; }
}

const env = loadEnvFile();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Constants ────────────────────────────────────────────────────────────────
const CITY = 'Berlin';
const PASSWORD = 'Test1234!';

/**
 * 3 test accounts — one per dashboard state.
 * Login with any of them to test that state instantly.
 */
const MAIN_ACCOUNTS = [
  {
    email: 'none@test.com',
    fullName: 'Dr. Lena Becker',
    specialty: 'Cardiology',
    careerStage: 'attending_senior',
    gender: 'female',
    birthYear: 1986,
    state: 'none',        // sees 3 day cards → can go through full booking flow
  },
  {
    email: 'reserved@test.com',
    fullName: 'Dr. Kai Richter',
    specialty: 'Surgery',
    careerStage: 'attending_early',
    gender: 'male',
    birthYear: 1989,
    state: 'reserved',    // already has a paid Friday booking → "You're in!" card
  },
  {
    email: 'matched@test.com',
    fullName: 'Dr. Anna Weber',
    specialty: 'Neurology',
    careerStage: 'fellow',
    gender: 'female',
    birthYear: 1991,
    state: 'matched',     // is in a group this week → group reveal card
  },
];

/** 8 real Berlin doctors to fill groups and matches */
const BERLIN_DOCTORS = [
  { fullName: 'Dr. Marcus Hoffmann', specialty: 'Internal Medicine',  gender: 'male',   careerStage: 'attending_senior', birthYear: 1980 },
  { fullName: 'Dr. Elena Braun',     specialty: 'Pediatrics',         gender: 'female', careerStage: 'fellow',           birthYear: 1990 },
  { fullName: 'Dr. Felix Wagner',    specialty: 'Emergency Medicine', gender: 'male',   careerStage: 'resident_senior',  birthYear: 1992 },
  { fullName: 'Dr. Sophie Müller',   specialty: 'Dermatology',        gender: 'female', careerStage: 'attending_early',  birthYear: 1988 },
  { fullName: 'Dr. Jan Fischer',     specialty: 'Orthopedics',        gender: 'male',   careerStage: 'attending_senior', birthYear: 1979 },
  { fullName: 'Dr. Nina Schulz',     specialty: 'Psychiatry',         gender: 'female', careerStage: 'resident_junior',  birthYear: 1994 },
  { fullName: 'Dr. Tom Keller',      specialty: 'Radiology',          gender: 'male',   careerStage: 'attending_early',  birthYear: 1987 },
  { fullName: 'Dr. Mia Schneider',   specialty: 'Gynecology',         gender: 'female', careerStage: 'attending_senior', birthYear: 1982 },
];

const NEIGHBORHOODS = [
  'Mitte', 'Prenzlauer Berg', 'Friedrichshain', 'Kreuzberg',
  'Charlottenburg', 'Schöneberg', 'Neukölln', 'Tempelhof',
];

// ── Date helpers ─────────────────────────────────────────────────────────────

function getUpcomingWeekend() {
  const now = new Date();
  const dow = now.getDay();
  const daysToFriday = dow === 0 ? 5 : dow === 6 ? 6 : 5 - dow;

  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);
  friday.setHours(19, 0, 0, 0);

  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);
  saturday.setHours(19, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(12, 0, 0, 0);

  return { friday, saturday, sunday };
}

/** Returns this week's Thursday — used as match_week for the 'matched' state */
function getThisThursday() {
  const now = new Date();
  const diff = 4 - now.getDay(); // positive = ahead, negative = last week
  const thu = new Date(now);
  thu.setDate(now.getDate() + (diff >= 0 ? diff : diff + 7));
  thu.setHours(0, 0, 0, 0);
  return thu.toISOString().split('T')[0];
}

// ── DB helpers ───────────────────────────────────────────────────────────────

function toEmail(fullName) {
  return `${fullName.toLowerCase().replace(/[^a-z]/g, '.')}@test.com`;
}

async function deleteByEmail(email) {
  // Look up uid via auth (profiles table has no email column)
  let uid = null;
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = list?.users?.find(u => u.email === email);
  uid = found?.id ?? null;

  if (!uid) return;

  await supabase.from('group_members').delete().eq('user_id', uid);
  await supabase.from('bookings').delete().eq('user_id', uid);
  await supabase.from('matches').delete().or(`user_id.eq.${uid},matched_user_id.eq.${uid}`);
  await supabase.from('onboarding_preferences').delete().eq('user_id', uid);
  await supabase.from('profiles').delete().eq('user_id', uid);
  await supabase.auth.admin.deleteUser(uid);
}

async function createUser({ email, fullName, specialty, careerStage, gender, birthYear, neighborhood }) {
  // Auth
  const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (authErr) { console.error(`  ❌ auth: ${email} — ${authErr.message}`); return null; }
  const uid = auth.user.id;

  // Profile (upsert because a DB trigger may auto-create a bare row on auth.users insert)
  const { error: profErr } = await supabase.from('profiles').upsert({
    user_id: uid, full_name: fullName,
    city: CITY, neighborhood: neighborhood ?? null,
    gender, date_of_birth: `${birthYear}-06-15`,
    languages: ['German', 'English'],
    status: 'active',
  }, { onConflict: 'user_id' });
  if (profErr) { console.error(`  ❌ profile: ${email} — ${profErr.message}`); return null; }

  // Onboarding prefs
  await supabase.from('onboarding_preferences').insert({
    user_id: uid, specialty, career_stage: careerStage,
    sports: ['running', 'cycling', 'gym', 'yoga'],
    social_style: ['ambivert'],
    culture_interests: ['art', 'music', 'cinema', 'theater'],
    lifestyle: ['active', 'balanced'],
    goals: ['networking', 'friendship'],
    availability_slots: ['weekend_morning', 'weekend_evening', 'friday_morning'],
    open_to_business: false,
    completed_at: new Date().toISOString(),
  });

  return uid;
}

// ── Steps ────────────────────────────────────────────────────────────────────

async function step1_clean() {
  console.log('\n🧹 Step 1 — Cleaning previous test data...');

  // Remove main accounts
  for (const acc of MAIN_ACCOUNTS) await deleteByEmail(acc.email);
  // Remove supporting doctors
  for (const doc of BERLIN_DOCTORS) await deleteByEmail(toEmail(doc.fullName));
  // Remove this weekend's Berlin events
  const { friday } = getUpcomingWeekend();
  const wStart = new Date(friday); wStart.setHours(0, 0, 0, 0);
  const wEnd   = new Date(friday); wEnd.setDate(friday.getDate() + 3); wEnd.setHours(23, 59, 59, 999);
  await supabase.from('events').delete().eq('city', CITY)
    .gte('date_time', wStart.toISOString()).lte('date_time', wEnd.toISOString());
  // Remove test groups
  await supabase.from('match_groups').delete().like('name', 'BeyondRounds Test%');

  console.log('   ✅ Done');
}

async function step2_supportingDoctors() {
  console.log('\n👥 Step 2 — Creating 8 Berlin supporting doctors...');
  const ids = [];
  for (let i = 0; i < BERLIN_DOCTORS.length; i++) {
    const doc = BERLIN_DOCTORS[i];
    const uid = await createUser({
      email: toEmail(doc.fullName),
      fullName: doc.fullName,
      specialty: doc.specialty,
      careerStage: doc.careerStage,
      gender: doc.gender,
      birthYear: doc.birthYear,
      neighborhood: NEIGHBORHOODS[i % NEIGHBORHOODS.length],
    });
    if (uid) {
      ids.push(uid);
      console.log(`   ✅ ${doc.fullName.padEnd(26)} ${doc.specialty}`);
    }
  }
  return ids;
}

async function step3_weekendEvents() {
  console.log('\n📅 Step 3 — Creating Berlin weekend events...');
  const { friday, saturday, sunday } = getUpcomingWeekend();

  const { data, error } = await supabase.from('events').insert([
    { city: CITY, meetup_type: 'dinner', date_time: friday.toISOString(),   neighborhood: 'Mitte',           max_participants: 24, status: 'open' },
    { city: CITY, meetup_type: 'dinner', date_time: saturday.toISOString(), neighborhood: 'Prenzlauer Berg', max_participants: 24, status: 'open' },
    { city: CITY, meetup_type: 'brunch', date_time: sunday.toISOString(),   neighborhood: 'Friedrichshain',  max_participants: 24, status: 'open' },
  ]).select('id, date_time');

  if (error) { console.error('   ❌', error.message); return {}; }

  const [fri, sat, sun] = data;
  console.log(`   ✅ Friday   ${friday.toDateString()}  19:00  → id: ${fri.id}`);
  console.log(`   ✅ Saturday ${saturday.toDateString()} 19:00  → id: ${sat.id}`);
  console.log(`   ✅ Sunday   ${sunday.toDateString()}  12:00  → id: ${sun.id}`);
  return { friday: fri.id, saturday: sat.id, sunday: sun.id };
}

async function step4_mainAccounts(supportingIds, eventIds) {
  console.log('\n🧑‍⚕️ Step 4 — Creating 3 main test accounts...');
  const uids = {};

  for (const acc of MAIN_ACCOUNTS) {
    const uid = await createUser({
      email: acc.email,
      fullName: acc.fullName,
      specialty: acc.specialty,
      careerStage: acc.careerStage,
      gender: acc.gender,
      birthYear: acc.birthYear,
      neighborhood: NEIGHBORHOODS[0],
    });
    if (!uid) continue;
    uids[acc.state] = uid;

    // ── Wire: reserved → paid Friday booking ────────────────────────────────
    if (acc.state === 'reserved') {
      if (!eventIds.friday) { console.warn('   ⚠️  No Friday event ID, skipping booking'); }
      else {
        const { data: bk, error: bkErr } = await supabase.from('bookings').insert({
          user_id: uid,
          event_id: eventIds.friday,
          status: 'confirmed',
          paid: true,
          preferences: { day: 'friday' },
        }).select('id').single();
        if (bkErr) console.error('   ❌ Booking:', bkErr.message);
        else       console.log(`   ✅ [reserved]  ${acc.fullName} — booked Friday (booking: ${bk.id})`);
      }
    }

    // ── Wire: matched → group this week with 3 supporting doctors ───────────
    if (acc.state === 'matched') {
      const matchWeek = getThisThursday();

      const { data: grp, error: grpErr } = await supabase.from('match_groups').insert({
        name: 'BeyondRounds Test Group – Berlin',
        group_type: 'mixed',
        gender_composition: '2F2M',
        status: 'active',
        match_week: matchWeek,
      }).select('id').single();

      if (grpErr) { console.error('   ❌ Group:', grpErr.message); continue; }
      const groupId = grp.id;

      // Add Anna + first 3 supporting doctors to the group
      const memberIds = [uid, ...supportingIds.slice(0, 3)];
      const { error: mErr } = await supabase.from('group_members').insert(
        memberIds.map(mid => ({ group_id: groupId, user_id: mid }))
      );
      if (mErr) console.error('   ❌ group_members:', mErr.message);

      // Create group conversation row (group_conversations has only group_id + id)
      const { error: cErr } = await supabase.from('group_conversations').insert({
        group_id: groupId,
      });
      if (cErr && !cErr.message?.includes('does not exist') && !cErr.message?.includes('relation')) {
        console.warn('   ⚠️  group_conversations:', cErr.message);
      }

      console.log(`   ✅ [matched]   ${acc.fullName} — group created (week: ${matchWeek}, ${memberIds.length} members)`);
    }

    if (acc.state === 'none') {
      console.log(`   ✅ [none]      ${acc.fullName} — no booking (will see 3 day cards)`);
    }
  }

  return uids;
}

async function step5_matches(allIds) {
  console.log('\n💘 Step 5 — Creating matches between all Berlin doctors...');
  const rows = [];
  for (let i = 0; i < allIds.length; i++) {
    for (let j = i + 1; j < allIds.length; j++) {
      rows.push({
        user_id: allIds[i],
        matched_user_id: allIds[j],
        match_score: 60 + Math.floor(Math.random() * 35), // 60–95
        status: 'accepted',
      });
    }
  }
  const { error } = await supabase.from('matches').insert(rows);
  if (error) console.error('   ❌ Matches:', error.message);
  else       console.log(`   ✅ Created ${rows.length} matches (${allIds.length} doctors)`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { friday } = getUpcomingWeekend();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║      BeyondRounds — Full System Seed                 ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`   City:    ${CITY}`);
  console.log(`   Weekend: ${friday.toDateString()} → Sunday`);

  await step1_clean();
  const supportingIds = await step2_supportingDoctors();
  const eventIds      = await step3_weekendEvents();
  const mainIds       = await step4_mainAccounts(supportingIds, eventIds);

  const allIds = [...Object.values(mainIds), ...supportingIds].filter(Boolean);
  await step5_matches(allIds);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  ✅  SEED COMPLETE                                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\n  Password for ALL accounts: Test1234!\n');

  console.log('  ┌─────────────────────────────────────────────────────────────┐');
  console.log('  │  DASHBOARD STATE   NAME              EMAIL                  │');
  console.log('  ├─────────────────────────────────────────────────────────────┤');
  console.log('  │  3 day cards  →   Dr. Lena Becker    none@test.com          │');
  console.log('  │  "You\'re in!" →   Dr. Kai Richter    reserved@test.com      │');
  console.log('  │  Group reveal →   Dr. Anna Weber     matched@test.com       │');
  console.log('  └─────────────────────────────────────────────────────────────┘');

  console.log('\n  Supporting Berlin doctors (password: Test1234!):');
  BERLIN_DOCTORS.forEach(d => {
    console.log(`    • ${d.fullName.padEnd(26)} ${toEmail(d.fullName)}`);
  });

  console.log('\n  Weekend events created:');
  const { friday: fri, saturday: sat, sunday: sun } = getUpcomingWeekend();
  console.log(`    • Friday   — ${fri.toDateString()} 19:00  Mitte`);
  console.log(`    • Saturday — ${sat.toDateString()} 19:00  Prenzlauer Berg`);
  console.log(`    • Sunday   — ${sun.toDateString()} 12:00  Friedrichshain`);
  console.log('');
}

main().catch(console.error);
