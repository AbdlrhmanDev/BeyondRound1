import { supabase } from "@/integrations/supabase/client";

export type MeetupType = "brunch" | "coffee" | "walk" | "sports" | "dinner";

export interface Event {
  id: string;
  city: string;
  meetup_type: MeetupType;
  date_time: string;
  neighborhood: string | null;
  max_participants: number;
  min_participants: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paid: boolean;
  payment_id: string | null;
  stripe_session_id: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const MEETUP_TYPE_LABELS: Record<MeetupType, string> = {
  brunch: "Brunch",
  coffee: "Coffee",
  walk: "Walk",
  sports: "Sports",
  dinner: "Dinner",
};

/** Fetch first open event of given type in city (for booking when user selects event type like "brunch") */
export async function getEventByTypeAndCity(
  meetupType: MeetupType,
  city: string = "Berlin"
): Promise<Event | null> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await (supabase as any)
      .from("events")
      .select("*")
      .eq("city", city)
      .eq("meetup_type", meetupType)
      .eq("status", "open")
      .gte("date_time", now)
      .order("date_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as Event;
  } catch {
    return null;
  }
}

/** Fetch a single event by ID */
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (error || !data) return null;
    return data as Event;
  } catch {
    return null;
  }
}

/** Fetch upcoming events for a city (default Berlin) */
export async function getUpcomingEvents(
  city: string = "Berlin",
  limit: number = 12
): Promise<Event[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await (supabase as any)
      .from("events")
      .select("*")
      .eq("city", city)
      .eq("status", "open")
      .gte("date_time", now)
      .order("date_time", { ascending: true })
      .limit(limit);

    if (error) return [];
    return ((data || []) as Event[]).filter((e: unknown) => e && typeof (e as Event).meetup_type === "string");
  } catch {
    return [];
  }
}

export interface EventWithSpots extends Event {
  spots_left: number;
}

/** Fetch upcoming events with spots left (for display) */
export async function getUpcomingEventsWithSpots(
  city: string = "Berlin",
  limit: number = 12
): Promise<EventWithSpots[]> {
  try {
    const events = await getUpcomingEvents(city, limit);
    if (events.length === 0) return [];

    const eventIds = events.map((e) => e.id);
    const { data: bookings } = await (supabase as any)
      .from("bookings")
      .select("event_id")
      .in("event_id", eventIds)
      .in("status", ["pending", "confirmed"]);

    const countByEvent = new Map<string, number>();
    for (const e of events) countByEvent.set(e.id, 0);
    for (const b of bookings || []) {
      const c = countByEvent.get(b.event_id) ?? 0;
      countByEvent.set(b.event_id, c + 1);
    }

    return events.map((e) => ({
      ...e,
      spots_left: Math.max(0, e.max_participants - (countByEvent.get(e.id) ?? 0)),
    }));
  } catch {
    return [];
  }
}

/** Create a booking */
export async function createBooking(
  userId: string,
  eventId: string,
  preferences?: Record<string, unknown>
): Promise<Booking | null> {
  const { data, error } = await (supabase as any)
    .from("bookings")
    .insert({
      user_id: userId,
      event_id: eventId,
      status: "pending",
      paid: false,
      preferences: preferences || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

/** Get user's bookings */
export async function getUserBookings(userId: string): Promise<(Booking & { event?: Event })[]> {
  try {
    if (!supabase) {
      console.warn("Supabase client not available");
      return [];
    }

    // Use left join to include bookings even if events were deleted
    const { data, error } = await (supabase as any)
      .from("bookings")
      .select(`
        *,
        event:events!left(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      
      // Try a simpler query without join to see if bookings exist
      const { data: bookingsOnly, error: bookingsError } = await (supabase as any)
        .from("bookings")
        .select("*")
        .eq("user_id", userId)
        .limit(5);
      
      if (bookingsError) {
        console.error("Error fetching bookings (simple query):", bookingsError);
      } else {
        console.log("Found bookings without events:", bookingsOnly?.length || 0);
        if (bookingsOnly && bookingsOnly.length > 0) {
          console.log("Sample booking:", bookingsOnly[0]);
        }
      }
      return [];
    }
    
    const result = (data as (Booking & { event?: Event })[]) || [];
    console.log(`Found ${result.length} bookings for user ${userId}`);
    
    if (result.length > 0) {
      const withEvents = result.filter(b => b.event).length;
      const withoutEvents = result.length - withEvents;
      console.log(`  - ${withEvents} with events, ${withoutEvents} without events`);
      if (result.length > 0) {
        console.log("Sample booking:", {
          id: result[0].id,
          event_id: result[0].event_id,
          status: result[0].status,
          hasEvent: !!result[0].event
        });
      }
    } else {
      console.log("No bookings found in database for this user");
    }
    
    return result;
  } catch (err) {
    console.error("Exception fetching bookings:", err);
    return [];
  }
}

/** Weekend day info for Choose Day module */
export interface WeekendDay {
  dayName: "Friday" | "Saturday" | "Sunday";
  date: string; // ISO date string
  dateFormatted: string; // e.g. "Friday, 21 February"
  timeSlot: string; // "Evening" or "Afternoon"
  eventId: string | null;
  spotsLeft: number;
  soldOut: boolean;
}

/** Get upcoming weekend dates (Fri/Sat/Sun) with event availability */
export async function getWeekendEvents(
  city: string = "Berlin"
): Promise<WeekendDay[]> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri, 6=Sat

  // Find next Friday (or this Friday if today is Mon-Fri before it)
  let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  if (daysUntilFriday === 0 && now.getHours() >= 22) daysUntilFriday = 7; // past Friday evening
  if (dayOfWeek === 0) daysUntilFriday = 5; // Sunday → next Friday

  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  friday.setHours(0, 0, 0, 0);

  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);

  const weekendDates = [friday, saturday, sunday];
  const dayNames: ("Friday" | "Saturday" | "Sunday")[] = ["Friday", "Saturday", "Sunday"];
  const timeSlots = ["Evening", "Evening", "Afternoon"];

  // Fetch events for these dates
  const startRange = friday.toISOString();
  const endRange = new Date(sunday.getTime() + 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: events } = await (supabase as any)
      .from("events")
      .select("*")
      .eq("city", city)
      .eq("status", "open")
      .gte("date_time", startRange)
      .lt("date_time", endRange)
      .order("date_time", { ascending: true });

    // Count bookings for these events
    const eventIds = (events || []).map((e: Event) => e.id);
    let bookingCounts = new Map<string, number>();

    if (eventIds.length > 0) {
      const { data: bookings } = await (supabase as any)
        .from("bookings")
        .select("event_id")
        .in("event_id", eventIds)
        .in("status", ["pending", "confirmed"]);

      for (const b of bookings || []) {
        bookingCounts.set(b.event_id, (bookingCounts.get(b.event_id) ?? 0) + 1);
      }
    }

    return weekendDates.map((date, i) => {
      const dateStr = date.toISOString().split("T")[0];
      const matchingEvent = (events || []).find((e: Event) =>
        e.date_time.startsWith(dateStr)
      );

      const spotsLeft = matchingEvent
        ? Math.max(0, matchingEvent.max_participants - (bookingCounts.get(matchingEvent.id) ?? 0))
        : 24; // default capacity

      const formatted = date.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      return {
        dayName: dayNames[i],
        date: dateStr,
        dateFormatted: formatted,
        timeSlot: timeSlots[i],
        eventId: matchingEvent?.id || null,
        spotsLeft,
        soldOut: matchingEvent ? spotsLeft === 0 : false,
      };
    });
  } catch {
    // Fallback: return weekend dates without event data
    return weekendDates.map((date, i) => ({
      dayName: dayNames[i],
      date: date.toISOString().split("T")[0],
      dateFormatted: date.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      timeSlot: timeSlots[i],
      eventId: null,
      spotsLeft: 24,
      soldOut: false,
    }));
  }
}

/** Check if user has an active booking for the upcoming weekend */
export async function getActiveBookingForWeekend(
  userId: string
): Promise<(Booking & { event?: Event }) | null> {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    if (daysUntilFriday === 0 && now.getHours() >= 22) daysUntilFriday = 7;
    if (dayOfWeek === 0) daysUntilFriday = 5;

    const friday = new Date(now);
    friday.setDate(now.getDate() + daysUntilFriday);
    friday.setHours(0, 0, 0, 0);

    const mondayAfter = new Date(friday);
    mondayAfter.setDate(friday.getDate() + 3);

    const { data, error } = await (supabase as any)
      .from("bookings")
      .select(`*, event:events!left(*)`)
      .eq("user_id", userId)
      .in("status", ["pending", "confirmed"])
      .gte("created_at", friday.toISOString())
      .lt("created_at", mondayAfter.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as Booking & { event?: Event };
  } catch {
    return null;
  }
}

/** Update booking with payment */
export async function updateBookingPayment(
  bookingId: string,
  stripeSessionId: string,
  paid: boolean = true
): Promise<void> {
  const { error } = await (supabase as any)
    .from("bookings")
    .update({
      stripe_session_id: stripeSessionId,
      paid,
      status: paid ? "confirmed" : "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) throw error;
}
