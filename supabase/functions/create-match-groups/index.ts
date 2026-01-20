import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
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
      const batch = [];

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

    // خلط المستخدمين عشوائياً
    const shuffledUsers = usersNotInGroups.sort(() => Math.random() - 0.5);
    const usersInGroups = new Set<string>();
    let groupNumber = 1;
    let groupsCreated = 0;

    for (const user of shuffledUsers) {
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
            targetGroup = group.id;
            break;
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
              targetGroup = group.id;
              break;
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
            targetGroup = group.id;
            break;
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
              targetGroup = group.id;
              break;
            }
          }
        }
      }

      // إنشاء مجموعة جديدة إذا لم تجد واحدة مناسبة
      if (!targetGroup) {
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

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${groupsCreated} groups for ${usersInGroups.size} users`,
        groupsCreated,
        usersAdded: usersInGroups.size,
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
