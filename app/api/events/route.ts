import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type MeetupType = "brunch" | "coffee" | "walk" | "sports" | "dinner";

/** Create a single event (used when user books and no event exists) */
export async function POST(request: NextRequest) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { city = "Berlin", meetup_type, date_time, neighborhood = null } = body;

    if (!meetup_type || !date_time) {
      return NextResponse.json(
        { error: "meetup_type and date_time required" },
        { status: 400 }
      );
    }

    const validTypes: MeetupType[] = ["brunch", "coffee", "walk", "sports", "dinner"];
    if (!validTypes.includes(meetup_type)) {
      return NextResponse.json({ error: "Invalid meetup_type" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    ) as any;

    const { data, error } = await supabase
      .from("events")
      .insert({
        city,
        meetup_type,
        date_time: new Date(date_time).toISOString(),
        neighborhood: neighborhood || null,
        max_participants: 4,
        min_participants: 3,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data });
  } catch (err) {
    console.error("Error in create event API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
