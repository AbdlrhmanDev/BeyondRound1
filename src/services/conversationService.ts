/**
 * Conversation Service - Handles conversation-related operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Creates a new group conversation
 */
export const createGroupConversation = async (groupId: string): Promise<string> => {
  try {
    // Input validation
    if (!groupId?.trim()) {
      throw new Error("Invalid groupId for createGroupConversation");
    }

    const { data: newConvo, error } = await supabase
      .from("group_conversations")
      .insert({ group_id: groupId })
      .select()
      .single();

    if (error) throw error;
    if (!newConvo || !newConvo.id) {
      throw new Error("Failed to create conversation");
    }

    return newConvo.id;
  } catch (error) {
    console.error("Error creating group conversation:", error);
    throw error;
  }
};

/**
 * Gets conversation ID for a group, creating it if it doesn't exist
 */
export const getOrCreateGroupConversation = async (groupId: string): Promise<string> => {
  try {
    // Input validation
    if (!groupId?.trim()) {
      throw new Error("Invalid groupId for getOrCreateGroupConversation");
    }

    // Check if conversation already exists
    const { data: existingConvo, error: fetchError } = await supabase
      .from("group_conversations")
      .select("id")
      .eq("group_id", groupId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingConvo && existingConvo.id) {
      return existingConvo.id;
    }

    // Create new conversation
    return await createGroupConversation(groupId);
  } catch (error) {
    console.error("Error getting or creating group conversation:", error);
    throw error;
  }
};

/**
 * Gets group conversations by group IDs
 */
export const getGroupConversationsByGroupIds = async (groupIds: string[]) => {
  try {
    // Input validation
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      console.error("Invalid groupIds for getGroupConversationsByGroupIds:", groupIds);
      return [];
    }

    const { data, error } = await supabase
      .from("group_conversations")
      .select("id, group_id")
      .in("group_id", groupIds);

    if (error) {
      console.error("Error fetching group conversations:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching group conversations:", error);
    return [];
  }
};
