import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/services/emailService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const internalSecret = request.headers.get('x-internal-secret');
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (!expectedSecret || internalSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date();
  const windows = [
    {
      hoursUntil: 24 as const,
      from: new Date(now.getTime() + 23 * 3_600_000),
      to: new Date(now.getTime() + 25 * 3_600_000),
    },
    {
      hoursUntil: 2 as const,
      from: new Date(now.getTime() + 1 * 3_600_000),
      to: new Date(now.getTime() + 3 * 3_600_000),
    },
  ];

  let sent24h = 0;
  let sent2h = 0;
  const errors: string[] = [];

  for (const window of windows) {
    const { data: events } = await supabase
      .from('events')
      .select('id, date_time, venue, city')
      .gte('date_time', window.from.toISOString())
      .lte('date_time', window.to.toISOString());

    if (!events || events.length === 0) continue;

    for (const event of events as { id: string; date_time: string; venue: string; city: string }[]) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('event_id', event.id)
        .eq('status', 'confirmed')
        .eq('paid', true);

      if (!bookings || bookings.length === 0) continue;

      const userIds = (bookings as { user_id: string }[]).map(b => b.user_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, locale')
        .in('id', userIds);

      const eventDate = new Date(event.date_time);
      const eventDateStr = eventDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const eventTimeStr = eventDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });

      for (const profile of (profiles ?? []) as { id: string; email: string; locale?: string }[]) {
        if (!profile.email) continue;
        try {
          await emailService.sendEventReminder(
            profile.email,
            {
              eventDate: eventDateStr,
              eventTime: eventTimeStr,
              venue: event.venue,
              city: event.city,
              locale: profile.locale ?? 'en',
            },
            window.hoursUntil,
          );
          if (window.hoursUntil === 24) sent24h++;
          else sent2h++;
        } catch (err) {
          errors.push(`${profile.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  return NextResponse.json({ sent24h, sent2h, errors });
}
