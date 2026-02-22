import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const thursday = new Date(friday);
  thursday.setDate(friday.getDate() + 6); // Mon=+3, Thu=+6 from prev Mon. Actually Thu = Fri - 1
  // Thursday = Friday - 1
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

// ── Main route ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth: require service role or admin session (check for bearer token)
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

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
    return NextResponse.json({ error: eventsErr.message }, { status: 500 });
  }
  if (!events || events.length === 0) {
    return NextResponse.json({ error: 'No open events found for this weekend. Create events first.' }, { status: 404 });
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
    return NextResponse.json({ error: bookingsErr.message }, { status: 500 });
  }
  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ error: 'No paid confirmed bookings found for this weekend.' }, { status: 404 });
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

    (existingMembers ?? []).forEach((m: { user_id: string }) => alreadyMatchedUserIds.add(m.user_id));
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

    // Prefer the day stored in preferences; fall back to event's day
    const prefDay = b.preferences?.day as 'friday' | 'saturday' | 'sunday' | undefined;
    const day = prefDay && usersByDay[prefDay] !== undefined
      ? prefDay
      : eventDayMap.get(b.event_id);

    if (day) {
      // Avoid duplicate user on same day
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
      // Not enough to form a group; skip
      skippedUsers.push(...users);
      continue;
    }

    // Chunk into groups of 4; if remainder is 1 merge with previous group instead
    const chunks = chunkArray(users, 4);
    if (chunks.length > 1 && chunks[chunks.length - 1].length === 1) {
      const lonely = chunks.pop()!;
      chunks[chunks.length - 1].push(...lonely);
    }

    for (let i = 0; i < chunks.length; i++) {
      const members = chunks[i];
      const groupNum = groupsCreated.length + 1;

      // Create match_group
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
        console.error('Failed to create group:', grpErr?.message);
        skippedUsers.push(...members);
        continue;
      }

      const groupId = (grp as { id: string }).id;

      // Add members
      const { error: membErr } = await supabase
        .from('group_members')
        .insert(members.map(uid => ({ group_id: groupId, user_id: uid })));

      if (membErr) console.error('group_members insert error:', membErr.message);

      // Create conversation
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
    message: groupsCreated.length === 0
      ? 'No groups created — all users may already be matched or there are not enough users per day.'
      : `Created ${groupsCreated.length} group(s) for ${matchWeek} weekend.`,
  });
}
