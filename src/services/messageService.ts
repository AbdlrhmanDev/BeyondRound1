/**
 * Message Service - Handles message-related operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  media_urls?: Array<{ url: string; type: string; size?: number }>;
  has_media?: boolean;
  media_type?: string;
  conversation_id?: string;
  group_conversation_id?: string;
  is_deleted?: boolean;
  is_ai?: boolean;
  edited_at?: string | null;
}

export interface MessageInsert {
  conversation_id?: string;
  group_conversation_id?: string;
  sender_id: string;
  content: string;
  media_urls?: Array<{ url: string; type: string; size?: number }>;
  has_media?: boolean;
  media_type?: string;
}

/**
 * Gets messages for a conversation
 */
export const getMessages = async (
  conversationId: string,
  limit: number = 100
): Promise<Message[]> => {
  try {
    // Input validation
    if (!conversationId?.trim()) {
      console.error("Invalid conversationId for getMessages:", conversationId);
      return [];
    }

    if (limit < 1 || limit > 1000) {
      console.warn("Invalid limit for getMessages, using default:", limit);
      limit = 100;
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .or("is_deleted.is.null,is_deleted.eq.false")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    // Validate data structure
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.filter((item): item is Message =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'sender_id' in item &&
      'content' in item &&
      'created_at' in item
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

/**
 * Gets messages for a group conversation
 */
export const getGroupMessages = async (
  groupConversationId: string,
  limit: number = 100
): Promise<Message[]> => {
  try {
    // Input validation
    if (!groupConversationId?.trim()) {
      console.error("Invalid groupConversationId for getGroupMessages:", groupConversationId);
      return [];
    }

    if (limit < 1 || limit > 1000) {
      console.warn("Invalid limit for getGroupMessages, using default:", limit);
      limit = 100;
    }

    const { data, error } = await supabase
      .from("group_messages")
      .select("*")
      .eq("conversation_id", groupConversationId)
      .or("is_deleted.is.null,is_deleted.eq.false")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching group messages:", error);
      return [];
    }

    // Validate data structure
    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Map group_messages to Message interface (convert conversation_id to group_conversation_id)
    return data
      .filter((item): item is any =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'sender_id' in item &&
        'content' in item &&
        'created_at' in item
      )
      .map((item) => ({
        ...item,
        group_conversation_id: item.conversation_id,
        conversation_id: undefined,
      })) as Message[];
  } catch (error) {
    console.error("Error fetching group messages:", error);
    return [];
  }
};

/**
 * Sends a message
 */
export const sendMessage = async (message: MessageInsert): Promise<Message | null> => {
  try {
    // Input validation
    if (!message || !message.sender_id?.trim()) {
      console.error("Invalid message data for sendMessage:", message);
      return null;
    }

    if (!message.conversation_id?.trim() && !message.group_conversation_id?.trim()) {
      console.error("Message must have either conversation_id or group_conversation_id");
      return null;
    }

    if (!message.content?.trim() && !message.has_media) {
      console.error("Message must have content or media");
      return null;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert(message)
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return null;
    }

    // Validate response data
    if (!data || typeof data !== 'object') {
      console.error("Invalid response data from sendMessage");
      return null;
    }

    return data as Message;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};

/**
 * Marks a message as read
 */
export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    // Input validation
    if (!messageId?.trim()) {
      console.error("Invalid messageId for markMessageAsRead:", messageId);
      return false;
    }

    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) {
      console.error("Error marking message as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking message as read:", error);
    return false;
  }
};

/**
 * Updates message media URLs
 */
export const updateMessageMedia = async (
  messageId: string,
  mediaUrls: Array<{ url: string; type: string; size?: number }>
): Promise<boolean> => {
  try {
    // Input validation
    if (!messageId?.trim()) {
      console.error("Invalid messageId for updateMessageMedia:", messageId);
      return false;
    }

    if (!Array.isArray(mediaUrls)) {
      console.error("Invalid mediaUrls for updateMessageMedia:", mediaUrls);
      return false;
    }

    const { error } = await supabase
      .from("messages")
      .update({
        media_urls: mediaUrls,
      })
      .eq("id", messageId);

    if (error) {
      console.error("Error updating message media:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating message media:", error);
    return false;
  }
};

/**
 * Gets conversation details
 */
export const getConversation = async (conversationId: string) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("match_id")
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("Error fetching conversation:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }
};

/**
 * Gets match details for finding other user
 */
export const getMatchForConversation = async (matchId: string) => {
  try {
    // Input validation
    if (!matchId?.trim()) {
      console.error("Invalid matchId for getMatchForConversation:", matchId);
      return null;
    }

    const { data, error } = await supabase
      .from("matches")
      .select("user_id, matched_user_id")
      .eq("id", matchId)
      .single();

    if (error) {
      console.error("Error fetching match:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching match:", error);
    return null;
  }
};

/**
 * Gets group conversation by ID
 */
export const getGroupConversation = async (conversationId: string) => {
  try {
    // Input validation
    if (!conversationId?.trim()) {
      console.error("Invalid conversationId for getGroupConversation:", conversationId);
      return null;
    }

    const { data, error } = await supabase
      .from("group_conversations")
      .select("group_id")
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("Error fetching group conversation:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching group conversation:", error);
    return null;
  }
};

/**
 * Sends a group message
 */
export const sendGroupMessage = async (message: {
  group_conversation_id: string;
  sender_id: string;
  content: string;
  media_urls?: Array<{ url: string; type: string; size?: number }>;
  has_media?: boolean;
  media_type?: string;
}): Promise<Message | null> => {
  try {
    // Input validation
    if (!message || !message.sender_id?.trim()) {
      console.error("Invalid message data for sendGroupMessage:", message);
      return null;
    }

    if (!message.group_conversation_id?.trim()) {
      console.error("Message must have group_conversation_id");
      return null;
    }

    if (!message.content?.trim() && !message.has_media) {
      console.error("Message must have content or media");
      return null;
    }

    // Convert group_conversation_id to conversation_id for group_messages table
    const { data, error } = await supabase
      .from("group_messages")
      .insert({
        conversation_id: message.group_conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        media_urls: message.media_urls || [],
        media_type: message.media_type,
        has_media: message.has_media || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending group message:", error);
      return null;
    }

    // Validate response data
    if (!data || typeof data !== 'object') {
      console.error("Invalid response data from sendGroupMessage");
      return null;
    }

    // Convert group_messages response to Message interface
    return {
      ...data,
      group_conversation_id: data.conversation_id,
      conversation_id: undefined,
    } as Message;
  } catch (error) {
    console.error("Error sending group message:", error);
    return null;
  }
};

/**
 * Updates group message media URLs
 */
export const updateGroupMessageMedia = async (
  messageId: string,
  mediaUrls: Array<{ url: string; type: string; size?: number }>
): Promise<boolean> => {
  try {
    // Input validation
    if (!messageId?.trim()) {
      console.error("Invalid messageId for updateGroupMessageMedia:", messageId);
      return false;
    }

    if (!Array.isArray(mediaUrls)) {
      console.error("Invalid mediaUrls for updateGroupMessageMedia:", mediaUrls);
      return false;
    }

    const { error } = await supabase
      .from("messages")
      .update({
        media_urls: mediaUrls,
      })
      .eq("id", messageId);

    if (error) {
      console.error("Error updating group message media:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating group message media:", error);
    return false;
  }
};
