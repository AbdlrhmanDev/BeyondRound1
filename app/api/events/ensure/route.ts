import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getWeekendDayDate(day: string): Date | null {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun 1=Mon … 5=Fri 6=Sat

  let daysToFriday: number;
  if (dow === 0) daysToFriday = 5;
  else if (dow === 6) daysToFriday = 6;
  else daysToFriday = 5 - dow;

  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);
  friday.setHours(0, 0, 0, 0);

  if (day === 'friday') {
    friday.setHours(19, 0, 0, 0);
    return friday;
  }
  if (day === 'saturday') {
    const sat = new Date(friday);
    sat.setDate(friday.getDate() + 1);
    sat.setHours(19, 0, 0, 0);
    return sat;
  }
  if (day === 'sunday') {
    const sun = new Date(friday);
    sun.setDate(friday.getDate() + 2);
    sun.setHours(12, 0, 0, 0);
    return sun;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Auth: require a valid authenticated session
  // (this endpoint is called during the user booking flow)
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cryptographically verify the JWT — getUser validates the signature server-side
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authErr } = await authClient.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { city?: string; day?: string };
  try {
    body = await request.json() as { city?: string; day?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { city, day } = body;
  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    return NextResponse.json({ error: 'Missing or invalid city' }, { status: 400 });
  }
  if (!day) {
    return NextResponse.json({ error: 'Missing day' }, { status: 400 });
  }

  const dayDate = getWeekendDayDate(day);
  if (!dayDate) {
    return NextResponse.json(
      { error: 'Invalid day — must be friday, saturday, or sunday' },
      { status: 400 }
    );
  }

  // Use service role key to bypass RLS for event creation
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayDate);
  dayEnd.setHours(23, 59, 59, 999);

  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('city', city.trim())
    .gte('date_time', dayStart.toISOString())
    .lte('date_time', dayEnd.toISOString())
    .in('status', ['open', 'full'])
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return NextResponse.json({ eventId: existing.id });
  }

  const { data: created, error } = await supabase
    .from('events')
    .insert({
      city: city.trim(),
      meetup_type: day === 'sunday' ? 'brunch' : 'dinner',
      date_time: dayDate.toISOString(),
      neighborhood: null,
      max_participants: 24,
      status: 'open',
    })
    .select('id')
    .single();

  if (error || !created) {
    console.error('[events/ensure] create error:', error?.message);
    return NextResponse.json({ error: 'Failed to create event slot' }, { status: 500 });
  }

  return NextResponse.json({ eventId: (created as { id: string }).id });
}
