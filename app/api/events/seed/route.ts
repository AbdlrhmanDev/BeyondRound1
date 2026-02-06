import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type MeetupType = "brunch" | "coffee" | "walk" | "sports" | "dinner";

interface EventConfig {
  city: string;
  meetupType: MeetupType;
  dayOffset: number; // Days from current date
  hour: number; // Hour of day (0-23)
  minute?: number;
  neighborhood?: string | null;
  maxParticipants?: number;
  minParticipants?: number;
}

// Fetch neighborhoods from API
async function fetchNeighborhoods(city: string, request: NextRequest, limit: number = 10): Promise<string[]> {
  try {
    // Build the API URL using the request origin
    const origin = request.headers.get('origin') || 
                  request.nextUrl.origin ||
                  process.env.NEXT_PUBLIC_SITE_URL ||
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const apiUrl = `${origin}/api/neighborhoods?city=${encodeURIComponent(city)}&limit=${limit}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'BeyondRounds-Events-Seed/1.0'
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch neighborhoods for ${city} (${response.status}), using empty array`);
      return [];
    }
    
    const data = await response.json();
    if (data.neighborhoods && Array.isArray(data.neighborhoods)) {
      // Extract value (slug) from neighborhood objects, or use label if value not available
      const neighborhoodValues = data.neighborhoods
        .map((n: { value?: string; label?: string }) => {
          if (n.value) return n.value;
          if (n.label) {
            // Convert label to slug format
            return n.label.toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[äöüß]/g, (c: string) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] || c));
          }
          return null;
        })
        .filter((v: string | null): v is string => v !== null)
        .slice(0, limit);
      
      return neighborhoodValues;
    }
    
    return [];
  } catch (error) {
    console.warn(`Error fetching neighborhoods for ${city}:`, error);
    return [];
  }
}

// Generate events for weekends
function generateWeekendEvents(
  city: string,
  weeksAhead: number = 4,
  neighborhoods: (string | null)[] = []
): EventConfig[] {
  const events: EventConfig[] = [];
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days until next Saturday
  const daysUntilSaturday = currentDay === 0 ? 6 : (6 - currentDay);
  
  // Use neighborhoods if provided, otherwise use null (no neighborhood specified)
  const neighborhood1 = neighborhoods[0] || null;
  const neighborhood2 = neighborhoods[1] || null;
  const neighborhood3 = neighborhoods[2] || null;
  const neighborhood4 = neighborhoods[3] || null;
  
  for (let week = 0; week < weeksAhead; week++) {
    const saturdayOffset = daysUntilSaturday + (week * 7);
    const sundayOffset = saturdayOffset + 1;
    
    // Saturday events
    events.push(
      { city, meetupType: "brunch", dayOffset: saturdayOffset, hour: 12, neighborhood: neighborhood1 },
      { city, meetupType: "brunch", dayOffset: saturdayOffset, hour: 12, neighborhood: neighborhood2 },
      { city, meetupType: "coffee", dayOffset: saturdayOffset, hour: 10, neighborhood: neighborhood3 },
      { city, meetupType: "dinner", dayOffset: saturdayOffset, hour: 19, neighborhood: neighborhood1 }
    );
    
    // Sunday events
    events.push(
      { city, meetupType: "walk", dayOffset: sundayOffset, hour: 11, neighborhood: neighborhood4 },
      { city, meetupType: "sports", dayOffset: sundayOffset, hour: 14, neighborhood: neighborhood1 },
      { city, meetupType: "brunch", dayOffset: sundayOffset, hour: 12, neighborhood: neighborhood2 }
    );
  }
  
  return events;
}

function createEventDate(dayOffset: number, hour: number, minute: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
        { status: 500 }
      );
    }

    // Create admin client (bypasses RLS). Events table not in generated types yet.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    ) as any;

    const body = await request.json().catch(() => ({}));
    const {
      city = "Berlin",
      weeksAhead = 4,
      neighborhoods: providedNeighborhoods = null, // null means fetch from API
      clearExisting = false,
    } = body;

    // Fetch neighborhoods from API if not provided
    let neighborhoods: (string | null)[];
    if (providedNeighborhoods && Array.isArray(providedNeighborhoods) && providedNeighborhoods.length > 0) {
      neighborhoods = providedNeighborhoods;
      console.log(`Using provided neighborhoods:`, neighborhoods);
    } else {
      console.log(`Fetching neighborhoods for ${city} from API...`);
      const fetchedNeighborhoods = await fetchNeighborhoods(city, request, 10);
      neighborhoods = fetchedNeighborhoods.length > 0 
        ? fetchedNeighborhoods.slice(0, 4) // Use top 4 neighborhoods
        : [null, null, null, null]; // No neighborhoods available
      console.log(`Found ${fetchedNeighborhoods.length} neighborhoods, using:`, neighborhoods);
    }

    // Optionally clear existing events for the city
    if (clearExisting) {
      const { error: deleteError } = await supabase
        .from("events")
        .delete()
        .eq("city", city)
        .gte("date_time", new Date().toISOString());
      
      if (deleteError) {
        console.warn("Error clearing existing events:", deleteError);
      }
    }

    // Generate event configurations
    const eventConfigs = generateWeekendEvents(city, weeksAhead, neighborhoods);

    // Convert to database format
    const eventsToInsert = eventConfigs.map((config) => ({
      city: config.city,
      meetup_type: config.meetupType,
      date_time: createEventDate(config.dayOffset, config.hour, config.minute || 0),
      neighborhood: config.neighborhood,
      max_participants: config.maxParticipants || 4,
      min_participants: config.minParticipants || 3,
      status: "open" as const,
    }));

    // Check for duplicates before inserting
    const existingEvents = await supabase
      .from("events")
      .select("city, meetup_type, date_time")
      .eq("city", city)
      .in("meetup_type", eventConfigs.map((e) => e.meetupType));

    const existingSet = new Set(
      (existingEvents.data || []).map((e: { city: string; meetup_type: string; date_time: string }) =>
        `${e.city}-${e.meetup_type}-${new Date(e.date_time).toISOString().split("T")[0]}`
      )
    );

    // Filter out duplicates (same city, type, and date)
    const uniqueEvents = eventsToInsert.filter((e) => {
      const key = `${e.city}-${e.meetup_type}-${new Date(e.date_time).toISOString().split("T")[0]}`;
      return !existingSet.has(key);
    });

    if (uniqueEvents.length === 0) {
      return NextResponse.json({
        message: "No new events to create (all already exist)",
        created: 0,
        skipped: eventsToInsert.length,
      });
    }

    // Insert events
    const { data, error } = await supabase
      .from("events")
      .insert(uniqueEvents)
      .select();

    if (error) {
      console.error("Error creating events:", error);
      return NextResponse.json(
        { error: "Failed to create events", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully created ${data?.length || 0} events`,
      created: data?.length || 0,
      skipped: eventsToInsert.length - (data?.length || 0),
      events: data,
    });
  } catch (error) {
    console.error("Error in seed events API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }) as any;

    const city = request.nextUrl.searchParams.get("city") || "Berlin";
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("city", city)
      .eq("status", "open")
      .gte("date_time", new Date().toISOString())
      .order("date_time", { ascending: true })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch events", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      events: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
