// Deno Edge Function - these imports are valid in Deno runtime
// IDE warnings about missing types are expected and won't affect runtime execution
// @ts-expect-error - Deno types are available at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno types are available at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the upcoming Thursday (the "match_week" reveal date) and
 * this weekend's Friday–Sunday date range, all in UTC.
 *
 * Logic:
 *   - Run Monday–Wednesday → target is this-coming Thu/Fri-Sun
 *   - Run Thursday           → target is NEXT Thu/Fri-Sun (groups already revealed)
 *   - Run Friday–Sunday      → target is NEXT Thu/Fri-Sun
 */
function getWeekendWindow(): {
  matchWeekDate: string;   // "YYYY-MM-DD" of Thursday
  fridayStart: Date;
  sundayEnd: Date;
} {
  const now = new Date();
  const dow = now.getUTCDay(); // 0=Sun 1=Mon … 4=Thu 5=Fri 6=Sat

  // Days until NEXT Thursday (never 0 — if today IS Thursday, jump to next week)
  const daysUntilThursday = ((4 - dow + 7) % 7) || 7;

  const thursday = new Date(now);
  thursday.setUTCDate(now.getUTCDate() + daysUntilThursday);
  thursday.setUTCHours(0, 0, 0, 0);

  // Friday = Thursday + 1; Sunday 23:59 = Thursday + 3
  const fridayStart = new Date(thursday);
  fridayStart.setUTCDate(thursday.getUTCDate() + 1);
  fridayStart.setUTCHours(0, 0, 0, 0);

  const sundayEnd = new Date(thursday);
  sundayEnd.setUTCDate(thursday.getUTCDate() + 3);
  sundayEnd.setUTCHours(23, 59, 59, 999);

  const matchWeekDate = thursday.toISOString().split("T")[0];
  return { matchWeekDate, fridayStart, sundayEnd };
}

function dayKeyFromDate(date: Date): "friday" | "saturday" | "sunday" | null {
  const d = date.getUTCDay();
  if (d === 5) return "friday";
  if (d === 6) return "saturday";
  if (d === 0) return "sunday";
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // @ts-expect-error - Deno global is available at runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-expect-error - Deno global is available at runtime
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Starting match groups creation process...");

    // ──────────────────────────────────────────────────────────────────────────
    // 0. Compute the target weekend window
    // ──────────────────────────────────────────────────────────────────────────
    const { matchWeekDate, fridayStart, sundayEnd } = getWeekendWindow();
    console.log(`📅 Target match_week: ${matchWeekDate} (Fri ${fridayStart.toISOString().slice(0,10)} → Sun ${sundayEnd.toISOString().slice(0,10)})`);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Find this weekend's events and build usersByDay from paid bookings
    // ──────────────────────────────────────────────────────────────────────────
    console.log("📅 Step 1: Loading paid bookings by day...");

    const { data: events, error: eventsErr } = await supabase
      .from("events")
      .select("id, date_time, city, meetup_type")
      .gte("date_time", fridayStart.toISOString())
      .lte("date_time", sundayEnd.toISOString())
      .in("status", ["open", "full"]);

    if (eventsErr) throw eventsErr;

    // Map event_id → { day, city, meetupType }
    interface EventInfo { day: "friday" | "saturday" | "sunday"; city: string; meetupType: string }
    const eventInfoMap = new Map<string, EventInfo>();
    for (const ev of (events ?? []) as { id: string; date_time: string; city: string; meetup_type: string }[]) {
      const day = dayKeyFromDate(new Date(ev.date_time));
      if (day) {
        eventInfoMap.set(ev.id, {
          day,
          city: ev.city ?? "Unknown",
          meetupType: ev.meetup_type ?? "meetup",
        });
      }
    }

    // Paid+confirmed bookings → group by slot (day:city:meetupType)
    const eventIds = Array.from(eventInfoMap.keys());

    interface Slot { day: "friday" | "saturday" | "sunday"; city: string; meetupType: string; users: Set<string> }
    const slots = new Map<string, Slot>();

    if (eventIds.length > 0) {
      const { data: bookings, error: bookingsErr } = await supabase
        .from("bookings")
        .select("user_id, event_id, preferences")
        .in("event_id", eventIds)
        .eq("paid", true)
        .eq("status", "confirmed");

      if (bookingsErr) throw bookingsErr;

      for (const b of (bookings ?? []) as {
        user_id: string;
        event_id: string;
        preferences: Record<string, string> | null;
      }[]) {
        const info = eventInfoMap.get(b.event_id);
        if (!info) continue;

        const prefDay = b.preferences?.day as "friday" | "saturday" | "sunday" | undefined;
        const day = prefDay && (prefDay === "friday" || prefDay === "saturday" || prefDay === "sunday")
          ? prefDay
          : info.day;

        const slotKey = `${day}:${info.city}:${info.meetupType}`;
        if (!slots.has(slotKey)) {
          slots.set(slotKey, { day, city: info.city, meetupType: info.meetupType, users: new Set() });
        }
        slots.get(slotKey)!.users.add(b.user_id);
      }
    }

    // Flatten for totals/logging
    const usersByDay: Record<"friday" | "saturday" | "sunday", Set<string>> = {
      friday: new Set(), saturday: new Set(), sunday: new Set(),
    };
    for (const slot of slots.values()) {
      for (const uid of slot.users) usersByDay[slot.day].add(uid);
    }

    const totalBooked = usersByDay.friday.size + usersByDay.saturday.size + usersByDay.sunday.size;
    console.log(
      `   Friday: ${usersByDay.friday.size} · Saturday: ${usersByDay.saturday.size} · Sunday: ${usersByDay.sunday.size} → ${totalBooked} total paid bookings`
    );

    if (totalBooked === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No paid confirmed bookings found for this weekend.",
          groupsCreated: 0,
          matchesCreated: 0,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Calculate match scores for new user pairs (within booked users only)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("📊 Step 2: Calculating match scores for booked users...");

    const allBookedUserIds = Array.from(
      new Set([...usersByDay.friday, ...usersByDay.saturday, ...usersByDay.sunday])
    );

    let matchesCreated = 0;
    const batchSize = 20;

    for (let i = 0; i < allBookedUserIds.length; i++) {
      const batch: Array<{ userA: string; userB: string }> = [];

      for (let j = i + 1; j < allBookedUserIds.length; j++) {
        batch.push({ userA: allBookedUserIds[i], userB: allBookedUserIds[j] });

        if (batch.length >= batchSize || j === allBookedUserIds.length - 1) {
          const batchResults = await Promise.all(
            batch.map(async ({ userA, userB }) => {
              const { data: existingMatch } = await supabase
                .from("matches")
                .select("id")
                .or(
                  `and(user_id.eq.${userA},matched_user_id.eq.${userB}),and(user_id.eq.${userB},matched_user_id.eq.${userA})`
                )
                .maybeSingle();

              if (existingMatch) return null;

              const { data: score, error: scoreError } = await supabase.rpc(
                "calculate_match_score",
                { user_a_id: userA, user_b_id: userB }
              );

              if (scoreError || !score || score < 20) return null;

              return {
                user_id: userA,
                matched_user_id: userB,
                match_score: score,
                status: "pending",
              };
            })
          );

          const validMatches = batchResults.filter((m) => m !== null);
          if (validMatches.length > 0) {
            const { error: batchError } = await supabase.from("matches").insert(validMatches);
            if (!batchError) matchesCreated += validMatches.length;
          }

          batch.length = 0;
        }
      }
    }

    console.log(`   ✅ Created ${matchesCreated} new match-score records`);

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Find users already grouped this week → exclude them
    // ──────────────────────────────────────────────────────────────────────────
    const { data: groupsThisWeek } = await supabase
      .from("match_groups")
      .select("id")
      .eq("match_week", matchWeekDate)
      .eq("status", "active");

    const existingGroupIds = (groupsThisWeek ?? []).map((g: { id: string }) => g.id);
    const alreadyMatchedUserIds = new Set<string>();

    if (existingGroupIds.length > 0) {
      const { data: existingMembers } = await supabase
        .from("group_members")
        .select("user_id")
        .in("group_id", existingGroupIds);

      (existingMembers ?? []).forEach((m: { user_id: string }) =>
        alreadyMatchedUserIds.add(m.user_id)
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Load gender info for all booked users
    // ──────────────────────────────────────────────────────────────────────────
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("user_id, gender")
      .in("user_id", allBookedUserIds);

    const genderMap = new Map<string, string>();
    for (const p of (profileRows ?? []) as { user_id: string; gender: string | null }[]) {
      genderMap.set(p.user_id, p.gender ?? "unknown");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Fetch waitlist users (priority boost)
    // ──────────────────────────────────────────────────────────────────────────
    interface WaitlistUser { user_id: string; priority: number; gender: string }
    let waitlistUsers: WaitlistUser[] = [];
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_waitlist_users_for_matching",
        { target_week: matchWeekDate }
      );
      if (rpcError) {
        console.warn("⚠️ Waitlist RPC not available:", rpcError.message);
      } else {
        waitlistUsers = (data as WaitlistUser[]) || [];
      }
    } catch (e) {
      console.warn("⚠️ Could not fetch waitlist users:", e);
    }
    const waitlistSet = new Set(waitlistUsers.map((u) => u.user_id));

    // ──────────────────────────────────────────────────────────────────────────
    // 6. Group users — per day, respecting match scores and gender composition
    // ──────────────────────────────────────────────────────────────────────────
    console.log("👥 Step 3: Creating groups per slot (day × city × meetup)...");

    const usersAddedToGroups = new Set<string>();
    let groupNumber = 1;
    let groupsCreated = 0;
    let partialGroupsCreated = 0;
    let waitlistAdded = 0;

    const DAY_LABELS: Record<string, string> = {
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    };

    // Sort slots: friday < saturday < sunday
    const DAY_ORDER: Record<string, number> = { friday: 0, saturday: 1, sunday: 2 };
    const sortedSlots = Array.from(slots.values()).sort(
      (a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day]
    );

    for (const slot of sortedSlots) {
      const { day, city, meetupType } = slot;

      // Filter: remove already-grouped users
      const candidates = Array.from(slot.users)
        .filter((uid) => !alreadyMatchedUserIds.has(uid))
        .map((uid) => ({ user_id: uid, gender: genderMap.get(uid) ?? "unknown" }));

      // Slot label used in group name: "Friday - Berlin - meetup"
      const slotLabel = `${DAY_LABELS[day]} - ${city} - meetup`;

      if (candidates.length === 0) {
        console.log(`   "${slotLabel}": all users already grouped — skip`);
        continue;
      }

      console.log(`   "${slotLabel}": ${candidates.length} unmatched users`);

      // Prioritise waitlist users, then shuffle the rest
      const prioritised = candidates.filter((u) => waitlistSet.has(u.user_id));
      const normal = candidates
        .filter((u) => !waitlistSet.has(u.user_id))
        .sort(() => Math.random() - 0.5);
      const orderedCandidates = [...prioritised, ...normal];

      // ── Main grouping loop (match-score aware) ────────────────────────────
      for (const user of orderedCandidates) {
        if (usersAddedToGroups.has(user.user_id)) continue;

        // Try to slot into an existing group for this day
        let targetGroup: string | null = null;

        const sameGenderType =
          user.gender === "female" ? "all_female" : "all_male";

        const { data: dayGroups } = await supabase
          .from("match_groups")
          .select("id, group_type, gender_composition")
          .eq("match_week", matchWeekDate)
          .eq("status", "active")
          .like("name", `%${slotLabel}%`);

        for (const group of (dayGroups ?? []) as {
          id: string;
          group_type: string;
          gender_composition: string | null;
        }[]) {
          const { data: members } = await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", group.id);

          if (!members || members.length >= 5) continue;

          // Gender fit check
          if (
            group.group_type === "same_gender" &&
            group.gender_composition !== sameGenderType
          ) continue;

          // Must share at least one match-score record with someone in the group
          const memberIds = members.map((m: { user_id: string }) => m.user_id);
          let hasMatch = false;
          for (const memberId of memberIds) {
            const { data: match } = await supabase
              .from("matches")
              .select("id")
              .or(
                `and(user_id.eq.${user.user_id},matched_user_id.eq.${memberId}),and(user_id.eq.${memberId},matched_user_id.eq.${user.user_id})`
              )
              .maybeSingle();
            if (match) { hasMatch = true; break; }
          }

          if (hasMatch) { targetGroup = group.id; break; }
        }

        // No suitable existing group → create one
        if (!targetGroup) {
          const { data: currentDayGroups } = await supabase
            .from("match_groups")
            .select("group_type")
            .eq("match_week", matchWeekDate)
            .eq("status", "active")
            .like("name", `%${slotLabel}%`);

          const mixedCount = (currentDayGroups ?? []).filter(
            (g: { group_type: string }) => g.group_type === "mixed"
          ).length;
          const sameCount = (currentDayGroups ?? []).filter(
            (g: { group_type: string }) => g.group_type === "same_gender"
          ).length;

          const groupType = sameCount <= mixedCount ? "same_gender" : "mixed";
          const genderComp =
            groupType === "same_gender"
              ? sameGenderType
              : Math.random() < 0.5 ? "2F3M" : "3F2M";

          // Verify user has at least one available match partner for this day
          const { data: userMatches } = await supabase
            .from("matches")
            .select("user_id, matched_user_id")
            .or(`user_id.eq.${user.user_id},matched_user_id.eq.${user.user_id}`);

          const matchedIds = new Set<string>();
          for (const m of (userMatches ?? []) as {
            user_id: string;
            matched_user_id: string;
          }[]) {
            if (m.user_id === user.user_id) matchedIds.add(m.matched_user_id);
            else matchedIds.add(m.user_id);
          }

          const availablePartner = orderedCandidates.find(
            (c) =>
              c.user_id !== user.user_id &&
              !usersAddedToGroups.has(c.user_id) &&
              matchedIds.has(c.user_id)
          );

          if (!availablePartner) {
            console.log(`   ⏭️ Skipping ${user.user_id} (${day}) — no available match partner`);
            continue;
          }

          const { data: newGroup, error: groupError } = await supabase
            .from("match_groups")
            .insert({
              name: `${slotLabel}`,
              group_type: groupType,
              gender_composition: genderComp,
              status: "active",
              match_week: matchWeekDate,
              is_partial_group: false,
            })
            .select()
            .single();

          if (groupError || !newGroup) {
            console.error(`❌ Error creating group:`, groupError);
            continue;
          }

          targetGroup = (newGroup as { id: string }).id;
          groupNumber++;
          groupsCreated++;

          // Create group conversation
          await supabase
            .from("group_conversations")
            .insert({ group_id: targetGroup });
        }

        // Add user to the group
        if (targetGroup) {
          const { error: memberError } = await supabase
            .from("group_members")
            .insert({ group_id: targetGroup, user_id: user.user_id });

          if (!memberError) {
            usersAddedToGroups.add(user.user_id);
          } else {
            console.error(`❌ Error adding ${user.user_id} to group:`, memberError);
          }
        }
      }

      // ── Partial groups for remaining users on this day ────────────────────
      const stillUnmatched = orderedCandidates.filter(
        (u) => !usersAddedToGroups.has(u.user_id)
      );

      if (stillUnmatched.length >= 2) {
        console.log(
          `   ⚠️ ${stillUnmatched.length} unmatched users on ${DAY_LABELS[day]} — attempting partial groups`
        );

        const byGender = {
          female: stillUnmatched.filter((u) => u.gender === "female"),
          male:   stillUnmatched.filter((u) => u.gender !== "female"),
        };

        for (const [gender, pool] of Object.entries(byGender)) {
          if (pool.length < 2) continue;

          const groupMembers: typeof pool = [];
          for (const candidate of pool) {
            if (groupMembers.length === 0) {
              groupMembers.push(candidate);
              continue;
            }
            // At least one match with existing group members
            let hasMatch = false;
            for (const existing of groupMembers) {
              const { data: match } = await supabase
                .from("matches")
                .select("id")
                .or(
                  `and(user_id.eq.${candidate.user_id},matched_user_id.eq.${existing.user_id}),and(user_id.eq.${existing.user_id},matched_user_id.eq.${candidate.user_id})`
                )
                .maybeSingle();
              if (match) { hasMatch = true; break; }
            }
            if (hasMatch && groupMembers.length < 4) groupMembers.push(candidate);
            if (groupMembers.length >= 4) break;
          }

          if (groupMembers.length < 2) continue;

          const genderComp = gender === "female" ? "all_female" : "all_male";
          const { data: partialGroup, error: partialErr } = await supabase
            .from("match_groups")
            .insert({
              name: `${slotLabel} (Small)`,
              group_type: "same_gender",
              gender_composition: genderComp,
              status: "active",
              match_week: matchWeekDate,
              is_partial_group: true,
            })
            .select()
            .single();

          if (!partialErr && partialGroup) {
            const { error: membersErr } = await supabase
              .from("group_members")
              .insert(groupMembers.map((u) => ({
                group_id: (partialGroup as { id: string }).id,
                user_id: u.user_id,
              })));

            if (!membersErr) {
              await supabase
                .from("group_conversations")
                .insert({ group_id: (partialGroup as { id: string }).id });

              for (const m of groupMembers) {
                usersAddedToGroups.add(m.user_id);
                await supabase.from("notifications").insert({
                  user_id: m.user_id,
                  type: "system",
                  title: "Smaller Group This Week",
                  message: `You've been matched in a smaller group this ${DAY_LABELS[day]}. We'll fill more spots next round!`,
                  link: "/matches",
                  metadata: {
                    group_id: (partialGroup as { id: string }).id,
                    day,
                    is_partial: true,
                  },
                });
              }

              partialGroupsCreated++;
              groupNumber++;
              console.log(`   ✅ Partial group (${gender}, ${DAY_LABELS[day]}): ${groupMembers.length} members`);
            }
          }
        }
      }

      // ── Waitlist: users still unmatched on this day ───────────────────────
      const forWaitlist = orderedCandidates.filter(
        (u) => !usersAddedToGroups.has(u.user_id)
      );

      if (forWaitlist.length > 0) {
        const { data: existingWL } = await supabase
          .from("matching_waitlist")
          .select("user_id, priority")
          .in("user_id", forWaitlist.map((u) => u.user_id));

        const wlPriorityMap = new Map<string, number>();
        for (const entry of (existingWL ?? []) as {
          user_id: string;
          priority: number;
        }[]) {
          wlPriorityMap.set(entry.user_id, entry.priority);
        }

        const waitlistInserts = forWaitlist.map((u) => ({
          user_id: u.user_id,
          match_week: matchWeekDate,
          priority: (wlPriorityMap.get(u.user_id) ?? 0) + 1,
          reason: `insufficient_${day}_users`,
        }));

        const { error: wlErr } = await supabase
          .from("matching_waitlist")
          .upsert(waitlistInserts, { onConflict: "user_id,match_week" });

        if (!wlErr) {
          waitlistAdded += forWaitlist.length;
          for (const u of forWaitlist) {
            await supabase.from("notifications").insert({
              user_id: u.user_id,
              type: "system",
              title: "Prioritized for Next Round",
              message: `We couldn't fill a ${DAY_LABELS[day]} group this week, but you're at the top of the list next week!`,
              link: "/matches",
              metadata: { match_week: matchWeekDate, day },
            });
          }
          console.log(`   📋 ${forWaitlist.length} users added to waitlist (${day})`);
        }
      }
    } // end per-day loop

    // Remove matched users from waitlist
    if (usersAddedToGroups.size > 0) {
      await supabase
        .from("matching_waitlist")
        .delete()
        .in("user_id", Array.from(usersAddedToGroups));
    }

    const totalGroupsCreated = groupsCreated + partialGroupsCreated;
    const summary = `Created ${groupsCreated} full + ${partialGroupsCreated} partial groups (${totalGroupsCreated} total) for ${usersAddedToGroups.size} users. ${waitlistAdded} users waitlisted.`;
    console.log(`✅ ${summary}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: summary,
        groupsCreated,
        partialGroupsCreated,
        totalGroupsCreated,
        usersAdded: usersAddedToGroups.size,
        waitlistAdded,
        matchesCreated,
        matchWeek: matchWeekDate,
        byDay: {
          friday:   usersByDay.friday.size,
          saturday: usersByDay.saturday.size,
          sunday:   usersByDay.sunday.size,
        },
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = `❌ Error in create-match-groups: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error(msg);

    return new Response(
      JSON.stringify({ success: false, error: msg, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
