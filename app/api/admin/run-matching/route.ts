import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimit';

// ── Date helpers ────────────────────────────────────────────────────────────

function getWeekendBounds(): { start: Date; end: Date; friday: Date; matchWeek: string } {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun … 5=Fri 6=Sat

  let daysToFriday: number;
  if (dow === 0) daysToFriday = 5;
  else if (dow === 6) daysToFriday = 6;
  else daysToFriday = 5 - dow;

  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);
  friday.setHours(0, 0, 0, 0);

  const end = new Date(friday);
  end.setDate(friday.getDate() + 2);
  end.setHours(23, 59, 59, 999);

  // match_week is the Thursday of the same week (Thu reveal day)
  const thu = new Date(friday);
  thu.setDate(friday.getDate() - 1);
  const matchWeek = thu.toISOString().split('T')[0];

  return { start: friday, end, friday, matchWeek };
}

function dayLabel(date: Date): 'friday' | 'saturday' | 'sunday' {
  const d = date.getDay();
  if (d === 5) return 'friday';
  if (d === 6) return 'saturday';
  return 'sunday';
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── Auth helper ─────────────────────────────────────────────────────────────

/**
 * Validates the request is from:
 *   A) An automated cron caller via INTERNAL_API_SECRET header, OR
 *   B) An authenticated admin user (has 'admin' role in user_roles table)
 *
 * Returns the validated caller identity string, or null if unauthorized.
 */
async function validateAdminRequest(
  request: NextRequest,
  supabaseUrl: string,
  serviceKey: string
): Promise<{ ok: true; callerId: string } | { ok: false; status: number; error: string }> {
  // Option A: Internal cron/automation via shared secret
  const internalSecret = request.headers.get('x-internal-secret');
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (expectedSecret && internalSecret === expectedSecret) {
    return { ok: true, callerId: 'internal-cron' };
  }

  // Option B: Authenticated admin user
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  // Cryptographically verify the JWT using the anon key (getUser makes a network call)
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authErr } = await authClient.auth.getUser(token);

  if (authErr || !user) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  // Check admin role using service role (bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: roleRow } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleRow?.role !== 'admin') {
    return { ok: false, status: 403, error: 'Forbidden: admin role required' };
  }

  return { ok: true, callerId: user.id };
}

// ── Main route ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Auth: require internal secret OR admin JWT
  const auth = await validateAdminRequest(request, supabaseUrl, serviceKey);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Rate limit: 20 calls per minute per caller
  const rlRes = checkRateLimit(auth.callerId, 'admin');
  if (rlRes) return rlRes;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { start, end, matchWeek } = getWeekendBounds();

  // 1. Find all events this weekend
  const { data: events, error: eventsErr } = await supabase
    .from('events')
    .select('id, date_time')
    .gte('date_time', start.toISOString())
    .lte('date_time', end.toISOString())
    .in('status', ['open', 'full']);

  if (eventsErr) {
    console.error('[run-matching] events query error:', eventsErr.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  if (!events || events.length === 0) {
    return NextResponse.json(
      { error: 'No open events found for this weekend. Create events first.' },
      { status: 404 }
    );
  }

  const eventIds = (events as { id: string; date_time: string }[]).map(e => e.id);

  // 2. Find all paid bookings for those events
  const { data: bookings, error: bookingsErr } = await supabase
    .from('bookings')
    .select('user_id, event_id, preferences')
    .in('event_id', eventIds)
    .eq('paid', true)
    .eq('status', 'confirmed');

  if (bookingsErr) {
    console.error('[run-matching] bookings query error:', bookingsErr.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  if (!bookings || bookings.length === 0) {
    return NextResponse.json(
      { error: 'No paid confirmed bookings found for this weekend.' },
      { status: 404 }
    );
  }

  // 3. Find users already in a group this week
  const { data: existingGroups } = await supabase
    .from('match_groups')
    .select('id')
    .eq('match_week', matchWeek)
    .eq('status', 'active');

  const existingGroupIds = (existingGroups ?? []).map((g: { id: string }) => g.id);
  const alreadyMatchedUserIds = new Set<string>();

  if (existingGroupIds.length > 0) {
    const { data: existingMembers } = await supabase
      .from('group_members')
      .select('user_id')
      .in('group_id', existingGroupIds);

    (existingMembers ?? []).forEach((m: { user_id: string }) =>
      alreadyMatchedUserIds.add(m.user_id)
    );
  }

  // 4. Build per-day user lists (exclude already matched users)
  const eventDayMap = new Map<string, 'friday' | 'saturday' | 'sunday'>();
  for (const ev of events as { id: string; date_time: string }[]) {
    eventDayMap.set(ev.id, dayLabel(new Date(ev.date_time)));
  }

  const usersByDay: Record<'friday' | 'saturday' | 'sunday', string[]> = {
    friday: [],
    saturday: [],
    sunday: [],
  };

  for (const b of bookings as { user_id: string; event_id: string; preferences: Record<string, string> | null }[]) {
    if (alreadyMatchedUserIds.has(b.user_id)) continue;

    const prefDay = b.preferences?.day as 'friday' | 'saturday' | 'sunday' | undefined;
    const day =
      prefDay && usersByDay[prefDay] !== undefined
        ? prefDay
        : eventDayMap.get(b.event_id);

    if (day) {
      if (!usersByDay[day].includes(b.user_id)) {
        usersByDay[day].push(b.user_id);
      }
    }
  }

  // 5. Create groups of 3–4 per day
  const groupsCreated: { day: string; groupId: string; memberCount: number }[] = [];
  const skippedUsers: string[] = [];

  for (const day of ['friday', 'saturday', 'sunday'] as const) {
    const users = usersByDay[day];
    if (users.length < 2) {
      skippedUsers.push(...users);
      continue;
    }

    const chunks = chunkArray(users, 4);
    if (chunks.length > 1 && chunks[chunks.length - 1].length === 1) {
      const lonely = chunks.pop()!;
      chunks[chunks.length - 1].push(...lonely);
    }

    for (let i = 0; i < chunks.length; i++) {
      const members = chunks[i];
      const groupNum = groupsCreated.length + 1;

      const { data: grp, error: grpErr } = await supabase
        .from('match_groups')
        .insert({
          name: `BeyondRounds ${day.charAt(0).toUpperCase() + day.slice(1)} Group ${groupNum}`,
          group_type: 'mixed',
          gender_composition: null,
          status: 'active',
          match_week: matchWeek,
        })
        .select('id')
        .single();

      if (grpErr || !grp) {
        console.error('[run-matching] Failed to create group:', grpErr?.message);
        skippedUsers.push(...members);
        continue;
      }

      const groupId = (grp as { id: string }).id;

      const { error: membErr } = await supabase
        .from('group_members')
        .insert(members.map(uid => ({ group_id: groupId, user_id: uid })));

      if (membErr) console.error('[run-matching] group_members insert error:', membErr.message);

      await supabase.from('group_conversations').insert({ group_id: groupId });

      groupsCreated.push({ day, groupId, memberCount: members.length });
    }
  }

  return NextResponse.json({
    ok: true,
    matchWeek,
    groupsCreated,
    totalGroupsCreated: groupsCreated.length,
    totalUsersMatched: groupsCreated.reduce((s, g) => s + g.memberCount, 0),
    skippedUsers: skippedUsers.length,
    message:
      groupsCreated.length === 0
        ? 'No groups created — all users may already be matched or there are not enough users per day.'
        : `Created ${groupsCreated.length} group(s) for ${matchWeek} weekend.`,
  });
}
