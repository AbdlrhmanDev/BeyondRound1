/**
 * Match Service - Data access layer for match-related operations
 * Following Dependency Inversion Principle - components depend on abstractions, not concrete implementations
 */

import { supabase, getSupabaseClient } from '@/integrations/supabase/client';
import { MatchGroup, GroupMember } from '@/types/match';
import { calculateAverageMatchScore } from '@/utils/matchCalculations';

interface GroupData {
  id: string;
  name: string | null;
  group_type: string;
  gender_composition: string | null;
  status: string;
  match_week: string;
  created_at: string;
  is_partial_group?: boolean;
}

/**
 * Fetches all active groups for a user
 */
export const fetchUserGroups = async (userId: string): Promise<MatchGroup[]> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for fetchUserGroups:", userId);
      return [];
    }

    // Fetch user's group memberships
    const { data: memberRes, error: memberError } = await getSupabaseClient()
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (memberError) throw memberError;
    if (!memberRes || memberRes.length === 0) {
      return [];
    }

    const groupIds = memberRes.map((m) => m.group_id);

    // Fetch group details
    let groupsData: GroupData[] | null = null;
    const { data, error: groupsError } = await getSupabaseClient()
      .from("match_groups")
      .select("*")
      .in("id", groupIds)
      .eq("status", "active")
      .order("match_week", { ascending: false });

    if (groupsError) {
      // Fallback if is_partial_group column doesn't exist
      if (groupsError.message?.includes("is_partial_group")) {
        const { data: fallbackData, error: fallbackError } = await getSupabaseClient()
          .from("match_groups")
          .select("id, name, group_type, gender_composition, status, match_week, created_at")
          .in("id", groupIds)
          .eq("status", "active")
          .order("match_week", { ascending: false });
        
        if (fallbackError) throw fallbackError;
        if (!fallbackData || fallbackData.length === 0) return [];
        
        groupsData = fallbackData.map(g => ({ ...g, is_partial_group: false }));
      } else {
        throw groupsError;
      }
    } else {
      groupsData = data;
    }

    if (!groupsData || groupsData.length === 0) {
      return [];
    }

    // Fetch all related data in parallel
    const allGroupIds = groupsData.map(g => g.id);
    
    const [membersRes, conversationsRes, matchesRes] = await Promise.all([
      getSupabaseClient()
        .from("group_members")
        .select("group_id, user_id")
        .in("group_id", allGroupIds),
      getSupabaseClient()
        .from("group_conversations")
        .select("id, group_id")
        .in("group_id", allGroupIds),
      getSupabaseClient()
        .from("matches")
        .select("matched_user_id, match_score, status")
        .eq("user_id", userId),
    ]);

    const allMembersData = membersRes.data || [];
    const conversationsData = conversationsRes.data || [];
    const matchesData = matchesRes.data || [];

    // Get all member user IDs (excluding current user)
    const allMemberIds = Array.from(new Set(
      allMembersData
        .map(m => m.user_id)
        .filter(id => id !== userId)
    ));

    // Fetch profiles and preferences in bulk
    let profilesData: Array<{
      user_id: string;
      full_name: string | null;
      avatar_url: string | null;
      city: string | null;
      neighborhood: string | null;
      gender: string | null;
    }> = [];
    let prefsData: Array<{
      user_id: string;
      specialty: string | null;
      sports: string[] | null;
      social_style: string[] | null;
      culture_interests: string[] | null;
      lifestyle: string[] | null;
      availability_slots: string[] | null;
    }> = [];

    if (allMemberIds.length > 0) {
      const [profilesResult, prefsResult] = await Promise.all([
        getSupabaseClient()
          .from("profiles")
          .select("user_id, full_name, avatar_url, city, neighborhood, gender")
          .in("user_id", allMemberIds),
        getSupabaseClient()
          .from("onboarding_preferences")
          .select("user_id, specialty, sports, social_style, culture_interests, lifestyle, availability_slots")
          .in("user_id", allMemberIds),
      ]);

      profilesData = profilesResult.data || [];
      prefsData = prefsResult.data || [];
    }

    // Create lookup maps
    const profilesMap = new Map(profilesData.map(p => [p.user_id, p]));
    const prefsMap = new Map(prefsData.map(p => [p.user_id, p]));
    const conversationsMap = new Map(conversationsData.map(c => [c.group_id, c.id]));

    // Group members by group_id
    const membersByGroup = new Map<string, string[]>();
    allMembersData.forEach(m => {
      if (!membersByGroup.has(m.group_id)) {
        membersByGroup.set(m.group_id, []);
      }
      membersByGroup.get(m.group_id)!.push(m.user_id);
    });

    // Create match scores map
    const matchScoresMap = new Map<string, number>();
    matchesData.forEach((match) => {
      if (match.match_score && match.match_score > 0) {
        matchScoresMap.set(match.matched_user_id, match.match_score);
      }
    });

    // Build enriched groups
    const enrichedGroups: MatchGroup[] = groupsData.map((group) => {
      const memberUserIds = membersByGroup.get(group.id) || [];
      const otherMemberIds = memberUserIds.filter((id) => id !== userId);
      
      const members: GroupMember[] = otherMemberIds.map((memberId) => ({
        user_id: memberId,
        profile: profilesMap.get(memberId) || { 
          user_id: memberId,
          full_name: null, 
          avatar_url: null, 
          city: null, 
          neighborhood: null, 
          gender: null 
        },
        preferences: prefsMap.get(memberId) || undefined,
      }));

      const averageScore = calculateAverageMatchScore(matchScoresMap, otherMemberIds);

      return {
        id: group.id,
        name: group.name,
        group_type: group.group_type,
        gender_composition: group.gender_composition,
        status: group.status,
        match_week: group.match_week,
        created_at: group.created_at,
        members,
        member_count: memberUserIds.length, // Total count including current user
        conversation_id: conversationsMap.get(group.id) as string | undefined,
        average_score: averageScore,
        is_partial_group: group.is_partial_group ?? false,
      };
    });

    // Sort by average_score (highest first), then by match_week (newest first)
    enrichedGroups.sort((a, b) => {
      const scoreA = a.average_score ?? 0;
      const scoreB = b.average_score ?? 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return new Date(b.match_week).getTime() - new Date(a.match_week).getTime();
    });

    return enrichedGroups;
  } catch (error) {
    console.error("Error fetching user groups:", error);
    throw error;
  }
};

/**
 * Checks if user should see evaluation survey for a group
 */
export const shouldShowEvaluationSurvey = async (
  userId: string,
  group: MatchGroup
): Promise<boolean> => {
  try {
    const now = new Date();
    const matchDate = new Date(group.match_week);
    matchDate.setHours(16, 0, 0, 0); // Thursday 4 PM
    const thursdayEvening = new Date(matchDate);
    thursdayEvening.setHours(20, 0, 0, 0); // Thursday 8 PM
    
    if (now < thursdayEvening) {
      return false;
    }

    // Check if user already submitted evaluation
    // Note: group_evaluations table exists but may not be in generated types
    try {
      const { data: existingEvaluation } = await (supabase as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: string) => {
              eq: (column: string, value: string) => {
                maybeSingle: () => Promise<{ data: { id: string } | null }>;
              };
            };
          };
        };
      }).from("group_evaluations")
        .select("id")
        .eq("user_id", userId)
        .eq("group_id", group.id)
        .maybeSingle();
      
      return !existingEvaluation;
    } catch (error) {
      // If table doesn't exist or query fails, assume no evaluation exists
      console.warn("Error checking group evaluation:", error);
      return true;
    }
  } catch (error) {
    console.error("Error checking evaluation survey:", error);
    return false;
  }
};

/**
 * Checks if user profile is complete
 */
export const checkProfileCompletion = async (userId: string): Promise<boolean> => {
  try {
    const { data: preferences } = await getSupabaseClient()
      .from("onboarding_preferences")
      .select("completed_at")
      .eq("user_id", userId)
      .maybeSingle();
    
    return !!preferences?.completed_at;
  } catch (error) {
    console.error("Error checking profile completion:", error);
    return false;
  }
};

/**
 * Gets group info by ID
 */
export const getGroupInfo = async (groupId: string) => {
  try {
    // Input validation
    if (!groupId?.trim()) {
      console.error("Invalid groupId for getGroupInfo:", groupId);
      return null;
    }

    const { data, error } = await getSupabaseClient()
      .from("match_groups")
      .select("name, id, match_week")
      .eq("id", groupId)
      .single();

    if (error) {
      console.error("Error fetching group info:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching group info:", error);
    return null;
  }
};

/**
 * Gets group members by group ID
 */
export const getGroupMembers = async (groupId: string) => {
  try {
    // Input validation
    if (!groupId?.trim()) {
      console.error("Invalid groupId for getGroupMembers:", groupId);
      return [];
    }

    const { data, error } = await getSupabaseClient()
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (error) {
      console.error("Error fetching group members:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching group members:", error);
    return [];
  }
};

/**
 * Gets user's group memberships (all groups user belongs to)
 */
export const getUserGroupMemberships = async (userId: string) => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getUserGroupMemberships:", userId);
      return [];
    }

    const { data, error } = await getSupabaseClient()
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user group memberships:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching user group memberships:", error);
    return [];
  }
};

/**
 * Gets groups by IDs
 */
export const getGroupsByIds = async (groupIds: string[], limit?: number) => {
  try {
    // Input validation
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      console.error("Invalid groupIds for getGroupsByIds:", groupIds);
      return [];
    }

    if (limit !== undefined && (limit < 1 || limit > 1000)) {
      console.warn("Invalid limit for getGroupsByIds, using default:", limit);
      limit = undefined;
    }

    let query = getSupabaseClient()
      .from("match_groups")
      .select("*")
      .in("id", groupIds)
      .eq("status", "active")
      .order("match_week", { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching groups:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
};

