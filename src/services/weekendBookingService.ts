import { getSupabaseClient } from '@/integrations/supabase/client';

export interface WeekendEvent {
  id: string;
  city: string;
  meetup_type: string;
  date_time: string;
  neighborhood: string | null;
  max_participants: number;
  status: string;
  bookings_count: number;
}

export interface WeekendEvents {
  friday: WeekendEvent | null;
  saturday: WeekendEvent | null;
  sunday: WeekendEvent | null;
}

export interface ActiveBooking {
  id: string;
  event_id: string;
  day: string;
  status: string;
  paid: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = ReturnType<typeof getSupabaseClient> & { from: (t: string) => any };

function db(): AnySupabase {
  return getSupabaseClient() as unknown as AnySupabase;
}

/** Returns Fri 00:00 → Sun 23:59 for the current/upcoming weekend. */
function getThisWeekendBounds(): { start: string; end: string; friday: Date; saturday: Date; sunday: Date } {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun 1=Mon … 5=Fri 6=Sat

  let daysToFriday: number;
  if (dow === 0) daysToFriday = -2;      // Sunday → last Fri
  else if (dow === 6) daysToFriday = -1; // Saturday → yesterday
  else daysToFriday = 5 - dow;           // Mon-Fri → this or upcoming Fri

  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);
  friday.setHours(0, 0, 0, 0);

  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);
  saturday.setHours(0, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  return { start: friday.toISOString(), end: sunday.toISOString(), friday, saturday, sunday };
}

/** Wider window (±7 days) so a Monday lookup still finds last-weekend bookings. */
function getBookingSearchBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function dayLabel(date: Date): 'friday' | 'saturday' | 'sunday' {
  const d = date.getDay();
  if (d === 5) return 'friday';
  if (d === 6) return 'saturday';
  return 'sunday';
}

/**
 * Fetches open weekend events for a city grouped by day (Fri/Sat/Sun).
 * Returns the first event per day slot (earliest date_time).
 */
export async function getWeekendEvents(city: string): Promise<WeekendEvents> {
  const result: WeekendEvents = { friday: null, saturday: null, sunday: null };
  try {
    const { start, end } = getThisWeekendBounds();

    const { data: events, error } = await db()
      .from('events')
      .select('id, city, meetup_type, date_time, neighborhood, max_participants, status')
      .eq('city', city)
      .gte('date_time', start)
      .lte('date_time', end)
      .in('status', ['open', 'full'])
      .order('date_time', { ascending: true });

    if (error || !events || events.length === 0) return result;

    // Batch-fetch paid booking counts for these events
    const eventIds: string[] = events.map((e: { id: string }) => e.id);
    const countsByEvent: Record<string, number> = {};
    const { data: bookings } = await db()
      .from('bookings')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('paid', true);

    if (bookings) {
      for (const b of bookings as { event_id: string }[]) {
        countsByEvent[b.event_id] = (countsByEvent[b.event_id] ?? 0) + 1;
      }
    }

    // Assign first event per day slot
    for (const event of events as { id: string; city: string; meetup_type: string; date_time: string; neighborhood: string | null; max_participants: number; status: string }[]) {
      const slot = dayLabel(new Date(event.date_time));
      if (!result[slot]) {
        result[slot] = { ...event, bookings_count: countsByEvent[event.id] ?? 0 };
      }
    }
  } catch (err) {
    console.error('getWeekendEvents error:', err);
  }
  return result;
}

/**
 * Returns the user's paid booking for any event within ±7 days (covers Mon gap),
 * or null if none exists.
 */
export async function getActiveWeekendBooking(userId: string): Promise<ActiveBooking | null> {
  try {
    const { start, end } = getBookingSearchBounds();

    // Find weekend event IDs in the search window
    const { data: events } = await db()
      .from('events')
      .select('id')
      .gte('date_time', start)
      .lte('date_time', end);

    if (!events || events.length === 0) return null;
    const eventIds = (events as { id: string }[]).map(e => e.id);

    const { data: booking } = await db()
      .from('bookings')
      .select('id, event_id, status, paid, preferences')
      .eq('user_id', userId)
      .eq('paid', true)
      .in('event_id', eventIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!booking) return null;

    const prefs = booking.preferences as Record<string, string> | null;
    return {
      id: booking.id,
      event_id: booking.event_id,
      day: prefs?.day ?? '',
      status: booking.status,
      paid: booking.paid,
    };
  } catch (err) {
    console.error('getActiveWeekendBooking error:', err);
    return null;
  }
}

/**
 * Inserts a pending (unpaid) booking row.
 * On duplicate (same user+event) returns the existing booking ID.
 */
export async function createPendingBooking(
  userId: string,
  eventId: string,
  day: string,
): Promise<string | null> {
  try {
    const { data, error } = await db()
      .from('bookings')
      .insert({ user_id: userId, event_id: eventId, status: 'pending', paid: false, preferences: { day } })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Conflict: fetch existing booking id
        const { data: existing } = await db()
          .from('bookings')
          .select('id')
          .eq('user_id', userId)
          .eq('event_id', eventId)
          .single();
        return (existing as { id: string } | null)?.id ?? null;
      }
      console.error('createPendingBooking error:', error);
      return null;
    }

    return (data as { id: string } | null)?.id ?? null;
  } catch (err) {
    console.error('createPendingBooking error:', err);
    return null;
  }
}

/**
 * Marks a booking as paid + confirmed (called after Stripe success return).
 */
export async function confirmBookingPaid(bookingId: string): Promise<boolean> {
  try {
    const { error } = await db()
      .from('bookings')
      .update({ paid: true, status: 'confirmed' })
      .eq('id', bookingId);

    if (error) {
      console.error('confirmBookingPaid error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('confirmBookingPaid error:', err);
    return false;
  }
}
