// Deno Edge Function for sending Friday reminder emails
// This function should be triggered by pg_cron every Friday at 9 AM UTC
// @ts-expect-error - Deno types are available at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno types are available at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // @ts-expect-error - Deno global is available at runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const appUrl = Deno.env.get("APP_URL") || "https://beyondrounds.app";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("📧 Starting Friday reminder email process...");

    // Calculate this weekend's date range
    const today = new Date();
    const dayOfWeek = today.getUTCDay();

    // Find this Saturday (if today is Friday, Saturday is tomorrow)
    const daysUntilSaturday = dayOfWeek === 5 ? 1 : (6 - dayOfWeek + 7) % 7;
    const saturday = new Date(today);
    saturday.setUTCDate(today.getUTCDate() + daysUntilSaturday);
    saturday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(saturday);
    sunday.setUTCDate(saturday.getUTCDate() + 1);
    sunday.setUTCHours(23, 59, 59, 999);

    console.log(`📅 Looking for meetups between ${saturday.toISOString()} and ${sunday.toISOString()}`);

    // Get all confirmed bookings for this weekend
    const { data: weekendBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        event:events(id, meetup_type, date_time, city)
      `)
      .eq("status", "confirmed")
      .gte("created_at", new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString());

    if (bookingsError) {
      throw bookingsError;
    }

    // Filter to only weekend bookings
    const validBookings = (weekendBookings || []).filter((b) => {
      const event = b.event as { date_time: string } | null;
      if (!event?.date_time) return false;
      const eventDate = new Date(event.date_time);
      return eventDate >= saturday && eventDate <= sunday;
    });

    console.log(`📋 Found ${validBookings.length} confirmed bookings for this weekend`);

    let emailsSent = 0;
    let emailsSkipped = 0;

    // Process each booking
    for (const booking of validBookings) {
      try {
        const event = booking.event as {
          id: string;
          meetup_type: string;
          date_time: string;
          city: string;
        };

        // Get user email
        const { data: authUser } = await supabase.auth.admin.getUserById(booking.user_id);
        if (!authUser?.user?.email) {
          emailsSkipped++;
          continue;
        }

        // Find user's group for this week
        const matchWeek = saturday.toISOString().split("T")[0];
        const { data: userGroup } = await supabase
          .from("group_members")
          .select(`
            group_id,
            match_groups!inner(id, match_week, status)
          `)
          .eq("user_id", booking.user_id)
          .eq("match_groups.match_week", matchWeek)
          .eq("match_groups.status", "active")
          .limit(1)
          .single();

        let chatUrl = `${appUrl}/en/events`;
        let groupMembers: string[] = [];

        if (userGroup) {
          // Get group conversation
          const { data: groupConv } = await supabase
            .from("group_conversations")
            .select("id")
            .eq("group_id", userGroup.group_id)
            .single();

          if (groupConv) {
            chatUrl = `${appUrl}/en/chat/group/${groupConv.id}`;
          }

          // Get group member names
          const { data: members } = await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", userGroup.group_id);

          if (members) {
            const otherMemberIds = members
              .map((m) => m.user_id)
              .filter((id) => id !== booking.user_id);

            if (otherMemberIds.length > 0) {
              const { data: memberProfiles } = await supabase
                .from("profiles")
                .select("full_name")
                .in("user_id", otherMemberIds);

              groupMembers = memberProfiles
                ?.filter((p) => p.full_name)
                .map((p) => p.full_name as string) || [];
            }
          }
        }

        // Send reminder email
        await supabase.functions.invoke("send-email", {
          body: {
            to: authUser.user.email,
            template: "friday_reminder",
            data: {
              userId: booking.user_id,
              meetupType: event.meetup_type,
              chatUrl,
              groupMembers,
            },
          },
        });

        // Also send a push notification as a reminder
        await supabase.functions.invoke("send-push-notification", {
          body: {
            userId: booking.user_id,
            title:  "🩺 Your meetup is this weekend!",
            body:   groupMembers.length > 0
              ? `You'll be meeting ${groupMembers.slice(0, 2).join(" & ")}${groupMembers.length > 2 ? " and others" : ""}. Check the group chat!`
              : "Your BeyondRounds meetup is coming up. Check the details.",
            url:  chatUrl,
            tag:  "friday-reminder",
          },
        }).catch((e: unknown) => {
          // Don't fail the whole run if push fails
          console.warn("Push notification failed:", e instanceof Error ? e.message : String(e));
        });

        emailsSent++;
        console.log(`✅ Sent reminder to ${authUser.user.email}`);
      } catch (userError) {
        console.error(`❌ Failed to send reminder to user ${booking.user_id}:`, userError);
        emailsSkipped++;
      }
    }

    console.log(`📧 Friday reminder complete: ${emailsSent} sent, ${emailsSkipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        emailsSkipped,
        totalBookings: validBookings.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error in send-friday-reminder:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
