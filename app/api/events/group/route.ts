import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** Get or create group + conversation for an event. Used when user clicks "Open Chat" on Events page. */
export async function POST(request: NextRequest) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    ) as any;

    // 1. Check if group already exists for this event
    const { data: existingGroup } = await supabase
      .from("match_groups")
      .select("id")
      .eq("event_id", eventId)
      .eq("status", "active")
      .maybeSingle();

    let groupId = existingGroup?.id;

    if (!groupId) {
      // 2. Get event and confirmed bookings
      const { data: event, error: eventErr } = await supabase
        .from("events")
        .select("id, meetup_type, date_time, city")
        .eq("id", eventId)
        .single();

      if (eventErr || !event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const { data: bookings } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("event_id", eventId)
        .in("status", ["confirmed", "pending"]);

      const userIds = [...new Set((bookings || []).map((b: { user_id: string }) => b.user_id))];
      if (userIds.length === 0) {
        return NextResponse.json({ error: "No confirmed bookings for this event" }, { status: 400 });
      }

      const eventDate = new Date(event.date_time);
      const matchWeek = eventDate.toISOString().split("T")[0];
      const groupName = `${event.meetup_type || "Meetup"} · ${event.city || "Berlin"} · ${eventDate.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })}`;

      // 3. Create match_group
      const { data: newGroup, error: groupErr } = await supabase
        .from("match_groups")
        .insert({
          name: groupName,
          group_type: "mixed",
          status: "active",
          match_week: matchWeek,
          event_id: eventId,
        })
        .select("id")
        .single();

      if (groupErr || !newGroup) {
        console.error("Error creating group:", groupErr);
        return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
      }
      groupId = newGroup.id;

      // 4. Add group members
      const members = userIds.map((user_id) => ({ group_id: groupId, user_id }));
      const { error: membersErr } = await supabase.from("group_members").insert(members);
      if (membersErr) {
        console.error("Error adding members:", membersErr);
      }
    }

    // 5. Get or create group_conversation
    const { data: conv } = await supabase
      .from("group_conversations")
      .select("id")
      .eq("group_id", groupId)
      .maybeSingle();

    let conversationId = conv?.id;
    if (!conversationId) {
      const { data: newConv, error: convErr } = await supabase
        .from("group_conversations")
        .insert({ group_id: groupId })
        .select("id")
        .single();
      if (convErr || !newConv) {
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
      }
      conversationId = newConv.id;
    }

    return NextResponse.json({ groupId, conversationId });
  } catch (err) {
    console.error("Error in events/group API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
