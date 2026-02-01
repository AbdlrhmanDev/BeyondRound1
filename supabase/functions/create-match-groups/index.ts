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

    // ============================================
    // حساب تاريخ الخميس للأسبوع القادم
    // ============================================
    const now = new Date();
    const currentDayOfWeek = now.getUTCDay(); // 0 = الأحد، 4 = الخميس
    const daysUntilThursday = (4 - currentDayOfWeek + 7) % 7 || 7;
    
    // حساب تاريخ الخميس القادم
    const nextThursday = new Date(now);
    nextThursday.setUTCDate(now.getUTCDate() + daysUntilThursday);
    nextThursday.setUTCHours(0, 0, 0, 0);
    
    const matchWeekDate = nextThursday.toISOString().split("T")[0];
    
    console.log(`📅 Creating groups for match_week: ${matchWeekDate}`);

    // ============================================
    // الخطوة 1: حساب نقاط المطابقة للمستخدمين الجدد
    // ============================================
    console.log("📊 Step 1: Calculating matches for new users...");
    
    // جلب جميع المستخدمين النشطين
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("status", "active");

    if (profilesError) {
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log("✅ No active users found");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active users found",
          groupsCreated: 0,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const userIds = profiles.map((p) => p.user_id);
    console.log(`👥 Found ${userIds.length} active users`);

    // حساب نقاط المطابقة للمستخدمين الذين ليس لديهم matches بعد
    let matchesCreated = 0;
    const batchSize = 20;
    const totalPairs = (userIds.length * (userIds.length - 1)) / 2;
    let processedPairs = 0;

    for (let i = 0; i < userIds.length; i++) {
      const batch: Array<{ userA: string; userB: string }> = [];

      for (let j = i + 1; j < userIds.length; j++) {
        const userA = userIds[i];
        const userB = userIds[j];

        batch.push({ userA, userB });

        if (batch.length >= batchSize || j === userIds.length - 1) {
          const batchResults = await Promise.all(
            batch.map(async ({ userA, userB }) => {
              // التحقق من وجود match مسبق
              const { data: existingMatch } = await supabase
                .from("matches")
                .select("id")
                .or(
                  `and(user_id.eq.${userA},matched_user_id.eq.${userB}),and(user_id.eq.${userB},matched_user_id.eq.${userA})`
                )
                .maybeSingle();

              if (existingMatch) return null;

              // حساب نقاط المطابقة
              const { data: score, error: scoreError } = await supabase.rpc(
                "calculate_match_score",
                {
                  user_a_id: userA,
                  user_b_id: userB,
                }
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
            const { error: batchError } = await supabase
              .from("matches")
              .insert(validMatches);

            if (!batchError) {
              matchesCreated += validMatches.length;
            }
          }

          processedPairs += batch.length;

          if (processedPairs % 100 === 0 || processedPairs === totalPairs) {
            const progress = ((processedPairs / totalPairs) * 100).toFixed(1);
            console.log(
              `   Progress: ${progress}% (${processedPairs}/${totalPairs} pairs, ${matchesCreated} matches created)`
            );
          }

          batch.length = 0;
        }
      }
    }

    console.log(`✅ Created ${matchesCreated} new matches`);

    // ============================================
    // الخطوة 2: إنشاء المجموعات
    // ============================================
    console.log("👥 Step 2: Creating groups...");

    // جلب جميع المستخدمين النشطين
    const { data: allUsers, error: allUsersError } = await supabase
      .from("profiles")
      .select("user_id, gender")
      .eq("status", "active");

    if (allUsersError) {
      throw allUsersError;
    }

    // جلب المجموعات لهذا الأسبوع أولاً
    const { data: groupsThisWeek, error: groupsError } = await supabase
      .from("match_groups")
      .select("id")
      .eq("match_week", matchWeekDate)
      .eq("status", "active");

    if (groupsError) {
      throw groupsError;
    }

    const groupIds = (groupsThisWeek || []).map((g) => g.id);

    // جلب المستخدمين الموجودين في مجموعات هذا الأسبوع
    let usersInGroupsThisWeek: { user_id: string }[] = [];
    if (groupIds.length > 0) {
      const { data, error: usersInGroupsError } = await supabase
        .from("group_members")
        .select("user_id")
        .in("group_id", groupIds);

      if (usersInGroupsError) {
        throw usersInGroupsError;
      }
      usersInGroupsThisWeek = data || [];
    }

    const usersInGroupsSet = new Set(
      (usersInGroupsThisWeek || []).map((u) => u.user_id)
    );

    // تصفية المستخدمين الذين ليسوا في مجموعات
    const usersNotInGroups =
      allUsers?.filter((u) => !usersInGroupsSet.has(u.user_id)) || [];

    if (!usersNotInGroups || usersNotInGroups.length === 0) {
      console.log("✅ All users are already in groups for this week");
      return new Response(
        JSON.stringify({
          success: true,
          message: "All users are already in groups for this week",
          groupsCreated: 0,
          matchesCreated,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(
      `👥 Found ${usersNotInGroups.length} users not in groups for this week`
    );

    // Get waitlist users with priority (from previous weeks)
    interface WaitlistUser {
      user_id: string;
      priority: number;
      gender: string;
    }
    let waitlistUsers: WaitlistUser[] = [];
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_waitlist_users_for_matching",
        { target_week: matchWeekDate }
      );
      if (rpcError) {
        console.warn("⚠️ Waitlist RPC function not available yet (migration may not be applied):", rpcError.message);
      } else {
        waitlistUsers = (data as WaitlistUser[]) || [];
      }
    } catch (error) {
      console.warn("⚠️ Could not fetch waitlist users:", error);
    }

    // Combine waitlist users (with priority) and new users
    const waitlistUserIds = new Set(waitlistUsers.map((u) => u.user_id));
    const prioritizedUsers = usersNotInGroups.filter((u) => waitlistUserIds.has(u.user_id));
    const newUsers = usersNotInGroups.filter((u) => !waitlistUserIds.has(u.user_id));

    // Put waitlist users first, then shuffle new users
    const shuffledNewUsers = newUsers.sort(() => Math.random() - 0.5);
    const allUsersToMatch = [...prioritizedUsers, ...shuffledNewUsers];

    const usersInGroups = new Set<string>();
    let groupNumber = 1;
    let groupsCreated = 0;

    for (const user of allUsersToMatch) {
      if (usersInGroups.has(user.user_id)) continue;

      let targetGroup: string | null = null;

      // محاولة إيجاد مجموعة موجودة مناسبة
      if (user.gender === "female") {
        // محاولة إيجاد مجموعة نسائية
        const { data: sameGenderGroups } = await supabase
          .from("match_groups")
          .select("id")
          .eq("status", "active")
          .eq("match_week", matchWeekDate)
          .eq("group_type", "same_gender")
          .eq("gender_composition", "all_female");

        for (const group of sameGenderGroups || []) {
          const { data: members } = await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", group.id);

          if (members && members.length < 5) {
            // التحقق من وجود تطابق بين المستخدم وأعضاء المجموعة
            const memberIds = members.map((m) => m.user_id);
            let hasMatch = false;
            
            for (const memberId of memberIds) {
              const { data: match } = await supabase
                .from("matches")
                .select("id")
                .or(
                  `and(user_id.eq.${user.user_id},matched_user_id.eq.${memberId}),and(user_id.eq.${memberId},matched_user_id.eq.${user.user_id})`
                )
                .maybeSingle();
              
              if (match) {
                hasMatch = true;
                break;
              }
            }
            
            if (hasMatch) {
              targetGroup = group.id;
              break;
            }
          }
        }

        // إذا لم تجد، جرب مجموعة مختلطة
        if (!targetGroup) {
          const { data: mixedGroups } = await supabase
            .from("match_groups")
            .select("id")
            .eq("status", "active")
            .eq("match_week", matchWeekDate)
            .eq("group_type", "mixed");

          for (const group of mixedGroups || []) {
            const { data: members } = await supabase
              .from("group_members")
              .select("user_id")
              .eq("group_id", group.id);

            if (members && members.length < 5) {
              // التحقق من وجود تطابق بين المستخدم وأعضاء المجموعة
              const memberIds = members.map((m) => m.user_id);
              let hasMatch = false;
              
              for (const memberId of memberIds) {
                const { data: match } = await supabase
                  .from("matches")
                  .select("id")
                  .or(
                    `and(user_id.eq.${user.user_id},matched_user_id.eq.${memberId}),and(user_id.eq.${memberId},matched_user_id.eq.${user.user_id})`
                  )
                  .maybeSingle();
                
                if (match) {
                  hasMatch = true;
                  break;
                }
              }
              
              if (hasMatch) {
                targetGroup = group.id;
                break;
              }
            }
          }
        }
      } else {
        // محاولة إيجاد مجموعة رجالية
        const { data: sameGenderGroups } = await supabase
          .from("match_groups")
          .select("id")
          .eq("status", "active")
          .eq("match_week", matchWeekDate)
          .eq("group_type", "same_gender")
          .eq("gender_composition", "all_male");

        for (const group of sameGenderGroups || []) {
          const { data: members } = await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", group.id);

          if (members && members.length < 5) {
            // التحقق من وجود تطابق بين المستخدم وأعضاء المجموعة
            const memberIds = members.map((m) => m.user_id);
            let hasMatch = false;
            
            for (const memberId of memberIds) {
              const { data: match } = await supabase
                .from("matches")
                .select("id")
                .or(
                  `and(user_id.eq.${user.user_id},matched_user_id.eq.${memberId}),and(user_id.eq.${memberId},matched_user_id.eq.${user.user_id})`
                )
                .maybeSingle();
              
              if (match) {
                hasMatch = true;
                break;
              }
            }
            
            if (hasMatch) {
              targetGroup = group.id;
              break;
            }
          }
        }

        // إذا لم تجد، جرب مجموعة مختلطة
        if (!targetGroup) {
          const { data: mixedGroups } = await supabase
            .from("match_groups")
            .select("id")
            .eq("status", "active")
            .eq("match_week", matchWeekDate)
            .eq("group_type", "mixed");

          for (const group of mixedGroups || []) {
            const { data: members } = await supabase
              .from("group_members")
              .select("user_id")
              .eq("group_id", group.id);

            if (members && members.length < 5) {
              // التحقق من وجود تطابق بين المستخدم وأعضاء المجموعة
              const memberIds = members.map((m) => m.user_id);
              let hasMatch = false;
              
              for (const memberId of memberIds) {
                const { data: match } = await supabase
                  .from("matches")
                  .select("id")
                  .or(
                    `and(user_id.eq.${user.user_id},matched_user_id.eq.${memberId}),and(user_id.eq.${memberId},matched_user_id.eq.${user.user_id})`
                  )
                  .maybeSingle();
                
                if (match) {
                  hasMatch = true;
                  break;
                }
              }
              
              if (hasMatch) {
                targetGroup = group.id;
                break;
              }
            }
          }
        }
      }

      // إنشاء مجموعة جديدة إذا لم تجد واحدة مناسبة
      // لكن فقط إذا كان المستخدم لديه تطابق مع مستخدمين آخرين
      if (!targetGroup) {
        // البحث عن مستخدمين آخرين لديهم تطابق مع هذا المستخدم
        const { data: userMatches } = await supabase
          .from("matches")
          .select("user_id, matched_user_id")
          .or(
            `user_id.eq.${user.user_id},matched_user_id.eq.${user.user_id}`
          );

        if (!userMatches || userMatches.length === 0) {
          // لا يوجد تطابق لهذا المستخدم، تخطيه
          console.log(
            `⏭️ Skipping user ${user.user_id} - no matches found`
          );
          continue;
        }

        // الحصول على قائمة المستخدمين المتطابقين
        const matchedUserIds = new Set<string>();
        userMatches.forEach((match) => {
          if (match.user_id === user.user_id) {
            matchedUserIds.add(match.matched_user_id);
          } else {
            matchedUserIds.add(match.user_id);
          }
        });

        // التحقق من وجود مستخدمين متطابقين متاحين (ليسوا في مجموعات)
        const availableMatchedUsers = Array.from(matchedUserIds).filter(
          (matchedId) => !usersInGroups.has(matchedId)
        );

        if (availableMatchedUsers.length === 0) {
          // لا يوجد مستخدمين متطابقين متاحين
          console.log(
            `⏭️ Skipping user ${user.user_id} - matched users already in groups`
          );
          continue;
        }

        const { data: existingGroups } = await supabase
          .from("match_groups")
          .select("group_type")
          .eq("match_week", matchWeekDate)
          .eq("status", "active");

        const mixedCount =
          existingGroups?.filter((g) => g.group_type === "mixed").length || 0;
        const sameCount =
          existingGroups?.filter((g) => g.group_type === "same_gender")
            .length || 0;

        const groupType = sameCount <= mixedCount ? "same_gender" : "mixed";
        const genderComp =
          groupType === "same_gender"
            ? user.gender === "female"
              ? "all_female"
              : "all_male"
            : Math.random() < 0.5
            ? "2F3M"
            : "3F2M";

        const { data: newGroup, error: groupError } = await supabase
          .from("match_groups")
          .insert({
            name: `Group ${groupNumber}`,
            group_type: groupType,
            gender_composition: genderComp,
            status: "active",
            match_week: matchWeekDate,
            is_partial_group: false, // Will be updated if needed
          })
          .select()
          .single();

        if (groupError || !newGroup) {
          console.error(`❌ Error creating group:`, groupError);
          continue;
        }

        targetGroup = newGroup.id;
        groupNumber++;
        groupsCreated++;
      }

      // إضافة المستخدم للمجموعة
      if (targetGroup) {
        const { error: memberError } = await supabase
          .from("group_members")
          .insert({
            group_id: targetGroup,
            user_id: user.user_id,
          });

        if (!memberError) {
          usersInGroups.add(user.user_id);
        } else {
          console.error(
            `❌ Error adding user ${user.user_id} to group:`,
            memberError
          );
        }
      }
    }

    console.log(
      `✅ Created ${groupsCreated} new groups and added ${usersInGroups.size} users`
    );

    // ============================================
    // Handle remaining unmatched users
    // ============================================
    const remainingUsers = allUsersToMatch.filter(
      (u) => !usersInGroups.has(u.user_id)
    );

    let waitlistAdded = 0;
    let partialGroupsCreated = 0;

    if (remainingUsers.length > 0) {
      console.log(
        `⚠️ Found ${remainingUsers.length} unmatched users after main matching`
      );

      // Group remaining users by gender for better matching
      const remainingByGender = {
        female: remainingUsers.filter((u) => u.gender === "female"),
        male: remainingUsers.filter((u) => u.gender === "male" || !u.gender),
      };

      // Try to create smaller groups (3-4 members)
      const minGroupSize = 3;
      const maxGroupSize = 4;

      // Process each gender group
      for (const [gender, users] of Object.entries(remainingByGender)) {
        if (users.length >= minGroupSize) {
          // التحقق من وجود تطابق بين المستخدمين قبل إنشاء المجموعة
          const groupMembers: typeof users = [];
          
          for (const user of users) {
            // التحقق من وجود تطابق مع الأعضاء الموجودين في المجموعة
            let hasMatchWithGroup = false;
            
            if (groupMembers.length > 0) {
              for (const existingMember of groupMembers) {
                const { data: match } = await supabase
                  .from("matches")
                  .select("id")
                  .or(
                    `and(user_id.eq.${user.user_id},matched_user_id.eq.${existingMember.user_id}),and(user_id.eq.${existingMember.user_id},matched_user_id.eq.${user.user_id})`
                  )
                  .maybeSingle();
                
                if (match) {
                  hasMatchWithGroup = true;
                  break;
                }
              }
            } else {
              // أول عضو في المجموعة - قبوله
              hasMatchWithGroup = true;
            }
            
            if (hasMatchWithGroup && groupMembers.length < maxGroupSize) {
              groupMembers.push(user);
            }
            
            if (groupMembers.length >= maxGroupSize) {
              break;
            }
          }
          
          // إنشاء المجموعة فقط إذا كان هناك على الأقل عضوين متطابقين
          if (groupMembers.length < 2) {
            console.log(
              `⏭️ Skipping partial group creation - insufficient matches (${groupMembers.length} members)`
            );
            continue;
          }
          
          const groupSize = groupMembers.length;

          // Partial groups are always same-gender since we're processing by gender
          const groupType = "same_gender";
          const genderComp =
            gender === "female" ? "all_female" : "all_male";

          const { data: partialGroup, error: partialError } = await supabase
            .from("match_groups")
            .insert({
              name: `Group ${groupNumber} (Small)`,
              group_type: groupType,
              gender_composition: genderComp,
              status: "active",
              match_week: matchWeekDate,
              is_partial_group: true,
            })
            .select()
            .single();

          if (!partialError && partialGroup) {
            // Add all members to the partial group
            const memberInserts = groupMembers.map((u) => ({
              group_id: partialGroup.id,
              user_id: u.user_id,
            }));

            const { error: membersError } = await supabase
              .from("group_members")
              .insert(memberInserts);

            if (!membersError) {
              groupMembers.forEach((u) => usersInGroups.add(u.user_id));
              partialGroupsCreated++;
              groupNumber++;

              // Send notification to partial group members
              for (const member of groupMembers) {
                await supabase.from("notifications").insert({
                  user_id: member.user_id,
                  type: "system",
                  title: "Smaller Group This Week",
                  message: `You've been matched with ${groupSize} members this week. We'll add more members next round!`,
                  link: "/matches",
                  metadata: {
                    group_id: partialGroup.id,
                    group_size: groupSize,
                    is_partial: true,
                  },
                });
              }

              console.log(
                `✅ Created partial group with ${groupSize} ${gender} members`
              );
            }
          }
        }
      }

      // Add remaining unmatched users to waitlist
      const stillUnmatched = remainingUsers.filter(
        (u) => !usersInGroups.has(u.user_id)
      );

      if (stillUnmatched.length > 0) {
        // Get existing waitlist entries to update priority
        interface WaitlistEntry {
          user_id: string;
          priority: number;
        }
        const { data: existingWaitlist } = await supabase
          .from("matching_waitlist")
          .select("user_id, priority")
          .in(
            "user_id",
            stillUnmatched.map((u) => u.user_id)
          );

        const existingPriorities = new Map<string, number>();
        if (existingWaitlist) {
          for (const entry of existingWaitlist as WaitlistEntry[]) {
            existingPriorities.set(entry.user_id, entry.priority);
          }
        }

        const waitlistInserts = stillUnmatched.map((u) => {
          const existingPriority = existingPriorities.get(u.user_id) ?? 0;
          const newPriority = existingPriority + 1; // Increase priority for each week unmatched
          return {
            user_id: u.user_id,
            match_week: matchWeekDate,
            priority: newPriority,
            reason: "insufficient_users",
          };
        });

        const { error: waitlistError } = await supabase
          .from("matching_waitlist")
          .upsert(waitlistInserts, {
            onConflict: "user_id,match_week",
          });

        if (!waitlistError) {
          waitlistAdded = stillUnmatched.length;

          // Send notifications to unmatched users
          for (const user of stillUnmatched) {
            const userPriority = existingPriorities.get(user.user_id) ?? 0;
            const newPriority = userPriority + 1;
            await supabase.from("notifications").insert({
              user_id: user.user_id,
              type: "system",
              title: "Prioritized for Next Round",
              message:
                "We couldn't find a complete group this week, but you're prioritized for next week's matching!",
              link: "/matches",
              metadata: {
                match_week: matchWeekDate,
                priority: newPriority,
              },
            });
          }

          console.log(
            `📋 Added ${waitlistAdded} users to waitlist for next round`
          );
        }
      }
    }

    // Remove users from waitlist who were successfully matched
    if (usersInGroups.size > 0) {
      await supabase
        .from("matching_waitlist")
        .delete()
        .in("user_id", Array.from(usersInGroups));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${groupsCreated} full groups, ${partialGroupsCreated} partial groups for ${usersInGroups.size} users. ${waitlistAdded} users added to waitlist.`,
        groupsCreated,
        partialGroupsCreated,
        usersAdded: usersInGroups.size,
        waitlistAdded,
        matchesCreated,
        matchWeek: matchWeekDate,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = `❌ Error in create-match-groups: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error(errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
