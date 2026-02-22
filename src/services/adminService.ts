/**
 * Admin Service - Handles admin operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalUsers: number;
  totalFeedback: number;
  totalMatches: number;
  totalGroups: number;
  pendingMatches: number;
  acceptedMatches: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  neighborhood: string | null;
  gender: string | null;
  created_at: string;
  status: string;
  banned_at: string | null;
  ban_reason: string | null;
  specialty?: string | null;
  career_stage?: string | null;
  completed_at?: string | null;
}

export interface Feedback {
  id: string;
  category: string;
  message: string;
  page_url: string | null;
  created_at: string;
  user_id: string | null;
}

export interface Match {
  id: string;
  user_id: string;
  matched_user_id: string;
  match_score: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MatchGroup {
  id: string;
  name: string | null;
  group_type: string;
  gender_composition: string | null;
  status: string;
  match_week: string;
  created_at: string;
  member_count?: number;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  target_table: string | null;
  target_id: string | null;
  old_values: unknown;
  new_values: unknown;
  reason: string | null;
  status: string | null;
  created_at: string;
  admin_name?: string;
  target_name?: string | null;
}

/**
 * Gets admin dashboard statistics
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const results = await Promise.allSettled([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("feedback").select("*", { count: "exact", head: true }),
      supabase.from("matches").select("*", { count: "exact", head: true }),
      supabase.from("match_groups").select("*", { count: "exact", head: true }),
      supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "accepted"),
    ]);

    const getCount = (result: PromiseSettledResult<{ count: number | null; error: unknown }>): number => {
      if (result.status === "fulfilled" && !result.value.error) {
        return result.value.count || 0;
      }
      if (result.status === "fulfilled" && result.value.error) {
        console.error("Error in admin stats query:", result.value.error);
      } else if (result.status === "rejected") {
        console.error("Promise rejected in admin stats:", result.reason);
      }
      return 0;
    };

    return {
      totalUsers: getCount(results[0]),
      totalFeedback: getCount(results[1]),
      totalMatches: getCount(results[2]),
      totalGroups: getCount(results[3]),
      pendingMatches: getCount(results[4]),
      acceptedMatches: getCount(results[5]),
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      totalUsers: 0,
      totalFeedback: 0,
      totalMatches: 0,
      totalGroups: 0,
      pendingMatches: 0,
      acceptedMatches: 0,
    };
  }
};

/**
 * Gets all users with their preferences
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError || !profiles) {
      console.error("Error fetching users:", profilesError);
      return [];
    }

    if (profiles.length === 0) {
      return [];
    }

    // Only fetch preferences for users that have profiles
    const userIds = profiles.map(p => p.user_id);
    const { data: preferences, error: prefsError } = await supabase
      .from("onboarding_preferences")
      .select("user_id, specialty, career_stage, completed_at")
      .in("user_id", userIds);

    if (prefsError) {
      console.error("Error fetching user preferences:", prefsError);
      // Continue without preferences rather than failing completely
    }

    const prefsMap = new Map(
      (preferences || []).map((p) => [p.user_id, p])
    );

    return profiles.map((profile) => {
      const prefs = prefsMap.get(profile.user_id);
      return {
        ...profile,
        specialty: prefs?.specialty || null,
        career_stage: prefs?.career_stage || null,
        completed_at: prefs?.completed_at || null,
      };
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

/**
 * Bans a user
 */
export const banUser = async (
  userId: string,
  reason: string,
  profileId: string
): Promise<boolean> => {
  try {
    // Input validation
    if (!userId || !profileId || !reason?.trim()) {
      console.error("Invalid input for banUser:", { userId, profileId, reason });
      return false;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        status: "banned",
        banned_at: new Date().toISOString(),
        ban_reason: reason.trim(),
      })
      .eq("id", profileId);

    if (error) {
      console.error("Error banning user:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error banning user:", error);
    return false;
  }
};

/**
 * Unbans a user
 */
export const unbanUser = async (profileId: string): Promise<boolean> => {
  try {
    // Input validation
    if (!profileId?.trim()) {
      console.error("Invalid profileId for unbanUser:", profileId);
      return false;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        status: "active",
        banned_at: null,
        ban_reason: null,
      })
      .eq("id", profileId);

    if (error) {
      console.error("Error unbanning user:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error unbanning user:", error);
    return false;
  }
};

/**
 * Updates user profile (admin)
 */
export const updateUserProfile = async (
  profileId: string,
  updates: Partial<UserProfile>
): Promise<boolean> => {
  try {
    // Input validation
    if (!profileId?.trim()) {
      console.error("Invalid profileId for updateUserProfile:", profileId);
      return false;
    }

    if (!updates || Object.keys(updates).length === 0) {
      console.error("No updates provided for updateUserProfile");
      return false;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profileId);

    if (error) {
      console.error("Error updating user profile:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return false;
  }
};

/**
 * Gets all feedback
 */
export const getFeedback = async (category?: string): Promise<Feedback[]> => {
  try {
    let query = supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching feedback:", error);
      return [];
    }

    // Validate data structure instead of type assertion
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.filter((item): item is Feedback => 
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'category' in item &&
      'message' in item &&
      'created_at' in item
    );
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return [];
  }
};

/**
 * Deletes feedback
 */
export const deleteFeedback = async (feedbackId: string): Promise<boolean> => {
  try {
    // Input validation
    if (!feedbackId?.trim()) {
      console.error("Invalid feedbackId for deleteFeedback:", feedbackId);
      return false;
    }

    const { error } = await supabase
      .from("feedback")
      .delete()
      .eq("id", feedbackId);

    if (error) {
      console.error("Error deleting feedback:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return false;
  }
};

/**
 * Gets all matches
 */
export const getMatches = async (limit: number = 100): Promise<Match[]> => {
  try {
    // Input validation
    if (limit < 1 || limit > 1000) {
      console.warn("Invalid limit for getMatches, using default:", limit);
      limit = 100;
    }

    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching matches:", error);
      return [];
    }

    // Validate data structure instead of type assertion
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.filter((item): item is Match =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'user_id' in item &&
      'matched_user_id' in item &&
      'status' in item &&
      'created_at' in item &&
      'updated_at' in item
    );
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
};

/**
 * Gets all match groups with member counts
 */
export const getMatchGroups = async (): Promise<MatchGroup[]> => {
  try {
    const [groupsRes, membersRes] = await Promise.allSettled([
      supabase
        .from("match_groups")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("group_members")
        .select("group_id"),
    ]);

    // Handle groups result
    if (groupsRes.status === "rejected") {
      console.error("Error fetching match groups:", groupsRes.reason);
      return [];
    }

    if (groupsRes.value.error || !groupsRes.value.data) {
      console.error("Error fetching match groups:", groupsRes.value.error);
      return [];
    }

    const groups = groupsRes.value.data;

    // Handle members result
    let memberCounts: Record<string, number> = {};
    if (membersRes.status === "fulfilled" && !membersRes.value.error && membersRes.value.data) {
      memberCounts = membersRes.value.data.reduce((acc, m) => {
        acc[m.group_id] = (acc[m.group_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    } else if (membersRes.status === "rejected") {
      console.warn("Error fetching group members, using 0 counts:", membersRes.reason);
    } else if (membersRes.status === "fulfilled" && membersRes.value.error) {
      console.warn("Error fetching group members, using 0 counts:", membersRes.value.error);
    }

    return groups.map((g) => ({
      ...g,
      member_count: memberCounts[g.id] || 0,
    }));
  } catch (error) {
    console.error("Error fetching match groups:", error);
    return [];
  }
};

/**
 * Gets audit logs with admin and target user names
 */
// ============================================================
// VERIFICATION
// ============================================================

export interface VerificationRequest {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  full_name?: string | null;
  city?: string | null;
  specialty?: string | null;
  career_stage?: string | null;
  verification_status?: string | null;
}

export const getVerificationQueue = async (statusFilter?: string): Promise<VerificationRequest[]> => {
  try {
    let query = (supabase as any)
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: true });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error("Error fetching verification queue:", error);
      return [];
    }

    const userIds = [...new Set((data as any[]).map((r) => r.user_id))] as string[];
    if (userIds.length === 0) return data;

    const [profilesRes, prefsRes] = await Promise.allSettled([
      (supabase as any).from("profiles").select("user_id, full_name, city, verification_status").in("user_id", userIds),
      (supabase as any).from("onboarding_preferences").select("user_id, specialty, career_stage").in("user_id", userIds),
    ]);

    const profileMap = new Map<string, any>();
    const prefsMap = new Map<string, any>();

    if (profilesRes.status === "fulfilled" && (profilesRes.value as any).data) {
      ((profilesRes.value as any).data as any[]).forEach((p: any) => profileMap.set(p.user_id, p));
    }
    if (prefsRes.status === "fulfilled" && (prefsRes.value as any).data) {
      ((prefsRes.value as any).data as any[]).forEach((p: any) => prefsMap.set(p.user_id, p));
    }

    return (data as any[]).map((r) => {
      const profile = profileMap.get(r.user_id);
      const prefs = prefsMap.get(r.user_id);
      return {
        ...r,
        full_name: profile?.full_name || null,
        city: profile?.city || null,
        verification_status: profile?.verification_status || null,
        specialty: prefs?.specialty || null,
        career_stage: prefs?.career_stage || null,
      };
    });
  } catch (error) {
    console.error("Error fetching verification queue:", error);
    return [];
  }
};

export const getVerificationDetail = async (userId: string): Promise<VerificationRequest | null> => {
  try {
    const { data } = await (supabase as any)
      .from("verification_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    const [profileRes, prefsRes] = await Promise.allSettled([
      (supabase as any).from("profiles").select("full_name, city, verification_status, created_at, avatar_url").eq("user_id", userId).single(),
      (supabase as any).from("onboarding_preferences").select("specialty, career_stage").eq("user_id", userId).single(),
    ]);

    const profile = profileRes.status === "fulfilled" ? profileRes.value.data : null;
    const prefs = prefsRes.status === "fulfilled" ? prefsRes.value.data : null;

    return {
      ...data,
      full_name: profile?.full_name || null,
      city: profile?.city || null,
      verification_status: profile?.verification_status || null,
      specialty: prefs?.specialty || null,
      career_stage: prefs?.career_stage || null,
    };
  } catch (error) {
    console.error("Error fetching verification detail:", error);
    return null;
  }
};

export const approveVerification = async (userId: string, reason?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_approve_verification' as any, {
      p_user_id: userId,
      p_reason: reason || null,
    });
    if (error) { console.error("Error approving verification:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error approving verification:", error); return false; }
};

export const rejectVerification = async (userId: string, reason: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_reject_verification' as any, {
      p_user_id: userId,
      p_reason: reason,
    });
    if (error) { console.error("Error rejecting verification:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error rejecting verification:", error); return false; }
};

export const requestReupload = async (userId: string, reason: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_request_reupload' as any, {
      p_user_id: userId,
      p_reason: reason,
    });
    if (error) { console.error("Error requesting reupload:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error requesting reupload:", error); return false; }
};

export const getSignedDocumentUrl = async (path: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage.from('verifications').createSignedUrl(path, 300);
    if (error) { console.error("Error creating signed URL:", error); return null; }
    return data?.signedUrl || null;
  } catch (error) { console.error("Error creating signed URL:", error); return null; }
};

// ============================================================
// REPORTS
// ============================================================

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter_name?: string | null;
  reported_name?: string | null;
}

export const getReports = async (statusFilter?: string): Promise<Report[]> => {
  try {
    let query = (supabase as any)
      .from("user_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error || !data) { console.error("Error fetching reports:", error); return []; }

    const userIds = [...new Set([
      ...(data as any[]).map((r: any) => r.reporter_id),
      ...(data as any[]).map((r: any) => r.reported_id),
    ].filter(Boolean))] as string[];

    if (userIds.length === 0) return data;

    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    return (data as any[]).map((r: any) => ({
      ...r,
      reporter_name: nameMap.get(r.reporter_id) || null,
      reported_name: nameMap.get(r.reported_id) || null,
    }));
  } catch (error) { console.error("Error fetching reports:", error); return []; }
};

export const getReportDetail = async (reportId: string): Promise<Report | null> => {
  try {
    const { data, error } = await (supabase as any)
      .from("user_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (error || !data) return null;

    const userIds = [data.reporter_id, data.reported_id].filter(Boolean);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    return {
      ...data,
      reporter_name: nameMap.get(data.reporter_id) || null,
      reported_name: nameMap.get(data.reported_id) || null,
    };
  } catch (error) { console.error("Error fetching report detail:", error); return null; }
};

export const updateReportStatus = async (reportId: string, status: string, notes?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_update_report' as any, {
      p_report_id: reportId,
      p_status: status,
      p_admin_notes: notes || null,
    });
    if (error) { console.error("Error updating report:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error updating report:", error); return false; }
};

// ============================================================
// USER MANAGEMENT (RPC-based)
// ============================================================

export const banUserRpc = async (userId: string, reason: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_ban_user' as any, { p_user_id: userId, p_reason: reason });
    if (error) { console.error("Error banning user:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error banning user:", error); return false; }
};

export const unbanUserRpc = async (userId: string, reason?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_unban_user' as any, { p_user_id: userId, p_reason: reason || 'Unbanned by admin' });
    if (error) { console.error("Error unbanning user:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error unbanning user:", error); return false; }
};

export const softDeleteUser = async (userId: string, reason: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_soft_delete_user' as any, { p_user_id: userId, p_reason: reason });
    if (error) { console.error("Error soft deleting user:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error soft deleting user:", error); return false; }
};

export const restoreUser = async (userId: string, reason?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_restore_user' as any, { p_user_id: userId, p_reason: reason || 'Restored by admin' });
    if (error) { console.error("Error restoring user:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error restoring user:", error); return false; }
};

export const changeUserRole = async (userId: string, newRole: string, reason: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_change_role' as any, { p_user_id: userId, p_new_role: newRole, p_reason: reason });
    if (error) { console.error("Error changing role:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error changing role:", error); return false; }
};

export const getUserDetail = async (userId: string): Promise<any | null> => {
  try {
    const [profileRes, prefsRes, groupsRes, reportsRes, verRes] = await Promise.allSettled([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("onboarding_preferences").select("*").eq("user_id", userId).single(),
      supabase.from("group_members").select("*, match_groups(*)").eq("user_id", userId),
      (supabase as any).from("user_reports").select("*").or(`reporter_id.eq.${userId},reported_id.eq.${userId}`).order("created_at", { ascending: false }),
      (supabase as any).from("verification_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    ]);

    const profile = profileRes.status === "fulfilled" ? profileRes.value.data : null;
    if (!profile) return null;

    return {
      profile,
      preferences: prefsRes.status === "fulfilled" ? prefsRes.value.data : null,
      groups: groupsRes.status === "fulfilled" ? groupsRes.value.data || [] : [],
      reports: reportsRes.status === "fulfilled" ? (reportsRes.value as any).data || [] : [],
      verification: verRes.status === "fulfilled" ? (verRes.value as any).data?.[0] || null : null,
    };
  } catch (error) { console.error("Error fetching user detail:", error); return null; }
};

// ============================================================
// GROUPS & CHAT MODERATION
// ============================================================

export const getGroups = async (statusFilter?: string): Promise<any[]> => {
  try {
    let query = supabase.from("match_groups").select("*").order("created_at", { ascending: false });
    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    const { data: groups, error } = await query;
    if (error || !groups) return [];

    const { data: members } = await supabase.from("group_members").select("group_id");
    const memberCounts: Record<string, number> = {};
    (members || []).forEach((m) => { memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1; });

    return groups.map((g) => ({ ...g, member_count: memberCounts[g.id] || 0 }));
  } catch (error) { console.error("Error fetching groups:", error); return []; }
};

export const getGroupDetail = async (groupId: string): Promise<any | null> => {
  try {
    const [groupRes, membersRes, convRes] = await Promise.allSettled([
      supabase.from("match_groups").select("*").eq("id", groupId).single(),
      supabase.from("group_members").select("*, profiles(user_id, full_name, avatar_url)").eq("group_id", groupId),
      (supabase as any).from("group_conversations").select("id").eq("group_id", groupId).single(),
    ]);

    const group = groupRes.status === "fulfilled" ? groupRes.value.data : null;
    if (!group) return null;

    const members = membersRes.status === "fulfilled" ? membersRes.value.data || [] : [];
    const conversationId = convRes.status === "fulfilled" ? (convRes.value as any).data?.id : null;

    return { group, members, conversationId };
  } catch (error) { console.error("Error fetching group detail:", error); return null; }
};

export const getGroupMessages = async (conversationId: string, limit: number = 50, offset: number = 0): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("group_messages")
      .select("*, profiles:sender_id(full_name, avatar_url)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) { console.error("Error fetching messages:", error); return []; }
    return data || [];
  } catch (error) { console.error("Error fetching messages:", error); return []; }
};

export const deleteMessage = async (messageId: string, reason: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_delete_message' as any, { p_message_id: messageId, p_reason: reason });
    if (error) { console.error("Error deleting message:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error deleting message:", error); return false; }
};

export const removeFromGroup = async (groupId: string, userId: string, reason: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_remove_from_group' as any, { p_group_id: groupId, p_user_id: userId, p_reason: reason });
    if (error) { console.error("Error removing from group:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error removing from group:", error); return false; }
};

export const disbandGroup = async (groupId: string, reason: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_disband_group' as any, { p_group_id: groupId, p_reason: reason });
    if (error) { console.error("Error disbanding group:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error disbanding group:", error); return false; }
};

export const sendSystemMessage = async (groupId: string, content: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_send_system_message' as any, { p_group_id: groupId, p_content: content });
    if (error) { console.error("Error sending system message:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error sending system message:", error); return false; }
};

// ============================================================
// WAITLIST & SURVEYS
// ============================================================

export const getWaitlist = async (): Promise<any[]> => {
  try {
    const { data, error } = await (supabase as any).from("waitlist").select("*").order("created_at", { ascending: false });
    if (error) { console.error("Error fetching waitlist:", error); return []; }
    return data || [];
  } catch (error) { console.error("Error fetching waitlist:", error); return []; }
};

export const getSurveySubmissions = async (): Promise<any[]> => {
  try {
    const { data, error } = await (supabase as any).from("survey_submissions").select("*").order("created_at", { ascending: false });
    if (error) { console.error("Error fetching surveys:", error); return []; }
    return data || [];
  } catch (error) { console.error("Error fetching surveys:", error); return []; }
};

// ============================================================
// APP CONFIG
// ============================================================

export const getAppConfig = async (): Promise<any[]> => {
  try {
    const { data, error } = await (supabase as any).from("app_config").select("*").order("key", { ascending: true });
    if (error) { console.error("Error fetching app config:", error); return []; }
    return data || [];
  } catch (error) { console.error("Error fetching app config:", error); return []; }
};

export const updateAppConfig = async (key: string, value: string, reason?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('admin_update_app_config' as any, {
      p_key: key, p_value: value, p_reason: reason || 'Config updated',
    });
    if (error) { console.error("Error updating app config:", error); return false; }
    return (data as any)?.success === true;
  } catch (error) { console.error("Error updating app config:", error); return false; }
};

// ============================================================
// AUDIT LOGS
// ============================================================

export const getAuditLogs = async (limit: number = 100): Promise<AuditLog[]> => {
  try {
    // Input validation
    if (limit < 1 || limit > 1000) {
      console.warn("Invalid limit for getAuditLogs, using default:", limit);
      limit = 100;
    }

    const { data: logsData, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !logsData) {
      console.error("Error fetching audit logs:", error);
      return [];
    }

    if (logsData.length === 0) {
      return [];
    }

    // Get unique admin and target user IDs
    const adminIds = [...new Set(logsData.map((l) => l.admin_id))];
    const targetIds = [...new Set(logsData.map((l) => l.target_user_id).filter(Boolean))] as string[];

    // Fetch profiles for names
    const allUserIds = [...adminIds, ...targetIds];
    let nameMap = new Map<string, string | null>();

    if (allUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", allUserIds);

      if (profilesError) {
        console.warn("Error fetching profiles for audit logs:", profilesError);
      } else {
        nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
      }
    }

    return logsData.map((log) => ({
      ...log,
      admin_name: nameMap.get(log.admin_id) || "Unknown Admin",
      target_name: log.target_user_id ? nameMap.get(log.target_user_id) || "Unknown User" : null,
    }));
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
};
