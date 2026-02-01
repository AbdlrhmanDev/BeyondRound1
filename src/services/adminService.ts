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
