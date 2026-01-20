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

    console.log("🔄 Starting match notifications process...");

    // ============================================
    // تحسين 1: طريقة أفضل لحساب تاريخ هذا الأسبوع
    // ============================================
    const now = new Date();
    
    // الحصول على يوم الأسبوع الحالي (0 = الأحد، 4 = الخميس)
    const currentDayOfWeek = now.getUTCDay();
    const daysUntilThursday = (4 - currentDayOfWeek + 7) % 7 || 7;
    
    // حساب تاريخ الخميس هذا الأسبوع
    const thisThursday = new Date(now);
    thisThursday.setUTCDate(now.getUTCDate() + (daysUntilThursday === 7 ? 0 : daysUntilThursday));
    thisThursday.setUTCHours(0, 0, 0, 0);
    
    const thursdayDateStr = thisThursday.toISOString().split("T")[0];
    
    console.log(`📅 Looking for groups with match_week: ${thursdayDateStr}`);

    // Get all active groups from this week
    const { data: groups, error: groupsError } = await supabase
      .from("match_groups")
      .select("id, name, match_week")
      .eq("status", "active")
      .eq("match_week", thursdayDateStr);

    if (groupsError) {
      throw groupsError;
    }

    if (!groups || groups.length === 0) {
      console.log("✅ No active groups found for this week");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active groups found for this week",
          groupsCount: 0,
          notificationsSent: 0,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`📨 Found ${groups.length} active groups for this week`);

    let notificationsSent = 0;
    let errors = 0;

    // ============================================
    // تحسين 4: جلب جميع البيانات دفعة واحدة بدلاً من حلقات متداخلة
    // ============================================
    
    // جلب جميع الأعضاء لجميع المجموعات دفعة واحدة
    const groupIds = groups.map(g => g.id);
    const { data: allMembers, error: allMembersError } = await supabase
      .from("group_members")
      .select("group_id, user_id")
      .in("group_id", groupIds);

    if (allMembersError) {
      throw allMembersError;
    }

    // جلب جميع المحادثات دفعة واحدة
    const { data: allConversations } = await supabase
      .from("group_conversations")
      .select("id, group_id")
      .in("group_id", groupIds);

    // إنشاء خريطة للمحادثات
    const conversationMap = new Map(
      (allConversations || []).map(c => [c.group_id, c.id])
    );

    // تجميع الأعضاء حسب المجموعة
    const membersByGroup = new Map<string, string[]>();
    (allMembers || []).forEach(m => {
      if (!membersByGroup.has(m.group_id)) {
        membersByGroup.set(m.group_id, []);
      }
      membersByGroup.get(m.group_id)!.push(m.user_id);
    });

    // ============================================
    // تحسين 5: جلب الإشعارات الموجودة دفعة واحدة
    // ============================================
    const allUserIds = Array.from(new Set((allMembers || []).map(m => m.user_id)));
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("user_id, metadata")
      .in("user_id", allUserIds)
      .eq("type", "system")
      .ilike("title", "%Match Group is Ready%");

    // إنشاء مجموعة للمستخدمين الذين لديهم إشعارات موجودة
    const notifiedUsers = new Set<string>();
    (existingNotifications || []).forEach(n => {
      const groupId = n.metadata?.group_id;
      if (groupId && groups.some(g => g.id === groupId)) {
        notifiedUsers.add(`${n.user_id}:${groupId}`);
      }
    });

    // ============================================
    // تحسين 6: إدراج جميع الإشعارات دفعة واحدة
    // ============================================
    const notificationsToInsert: any[] = [];

    for (const group of groups) {
      console.log(`🔄 Processing group: ${group.name || group.id}`);

      const members = membersByGroup.get(group.id) || [];

      if (members.length === 0) {
        console.warn(`No members found for group ${group.id}`);
        continue;
      }

      console.log(`👥 Group has ${members.length} members`);

      const conversationId = conversationMap.get(group.id);
      const notificationTitle = `🎉 Your Match Group is Ready!`;
      const notificationMessage = `Your group "${group.name || "match group"}" is ready to connect. Join the conversation now!`;

      // إعداد الإشعارات للإدراج
      for (const userId of members) {
        const notificationKey = `${userId}:${group.id}`;
        
        // تخطي إذا كان الإشعار موجوداً بالفعل
        if (notifiedUsers.has(notificationKey)) {
          console.log(`⏭️  Notification already sent for user ${userId}`);
          continue;
        }

        notificationsToInsert.push({
          user_id: userId,
          type: "system",
          title: notificationTitle,
          message: notificationMessage,
          link: conversationId
            ? `/group-chat/${conversationId}`
            : `/matches`,
          metadata: {
            group_id: group.id,
            group_name: group.name,
            conversation_id: conversationId || null,
            sent_at: new Date().toISOString(),
          },
        });
      }
    }

    // إدراج جميع الإشعارات دفعة واحدة
    if (notificationsToInsert.length > 0) {
      // تحسين: إدراج على دفعات لتجنب تجاوز الحد الأقصى
      const batchSize = 50;
      for (let i = 0; i < notificationsToInsert.length; i += batchSize) {
        const batch = notificationsToInsert.slice(i, i + batchSize);
        const { error: batchError } = await supabase
          .from("notifications")
          .insert(batch);

        if (batchError) {
          console.error(`Error inserting notification batch:`, batchError);
          errors += batch.length;
        } else {
          notificationsSent += batch.length;
          console.log(`✅ Inserted ${batch.length} notifications (batch ${Math.floor(i / batchSize) + 1})`);
        }
      }
    }

    const successMessage = `✅ Successfully sent ${notificationsSent} match notifications`;
    console.log(successMessage);

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        groupsProcessed: groups.length,
        notificationsSent,
        errors,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = `❌ Error in send-match-notifications: ${
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