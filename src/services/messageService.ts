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

/** Map DB row (media_urls may be string[]) to Message (media_urls as object array) */
function rowToMessage(row: Record<string, unknown>): Message {
  const raw = row.media_urls;
  const media_urls = Array.isArray(raw)
    ? raw.map((v) =>
        typeof v === 'object' && v !== null && 'url' in v
          ? { url: (v as { url: string }).url, type: (v as { type?: string }).type ?? 'image', size: (v as { size?: number }).size }
          : { url: String(v), type: 'image' as string }
      )
    : undefined;
  return { ...row, media_urls } as Message;
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

    return (data || [])
      .filter(
        (item): boolean =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'sender_id' in item &&
          'content' in item &&
          'created_at' in item
      )
      .map((item) => rowToMessage(item as Record<string, unknown>));
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

    if (!supabase) {
      console.warn("Supabase client not available for getGroupMessages");
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
      .filter(
        (item): boolean =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'sender_id' in item &&
          'content' in item &&
          'created_at' in item
      )
      .map((item) =>
        rowToMessage({
          ...(item as Record<string, unknown>),
          group_conversation_id: (item as Record<string, unknown>).conversation_id,
          conversation_id: undefined,
        })
      );
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
      .insert(message as never)
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

    return rowToMessage(data as Record<string, unknown>);
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
      .update({ media_urls: mediaUrls } as never)
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

    if (!supabase) {
      console.warn("Supabase client not available for getGroupConversation");
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

    // Build insert payload - only include media fields if has_media is true
    const insertPayload: Record<string, unknown> = {
      conversation_id: message.group_conversation_id,
      sender_id: message.sender_id,
      content: message.content,
    };

    // Only add media fields if there's media (to avoid issues if columns don't exist)
    if (message.has_media) {
      insertPayload.media_urls = message.media_urls || [];
      insertPayload.media_type = message.media_type;
      insertPayload.has_media = true;
    }

    console.log("[sendGroupMessage] Inserting message:", insertPayload);

    if (!supabase) {
      console.error("Supabase client not available for sendGroupMessage");
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("group_messages")
      .insert(insertPayload as any)
      .select()
      .single();

    if (error) {
      console.error("[sendGroupMessage] Supabase error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    console.log("[sendGroupMessage] Success! Data:", data);

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
    } as unknown as Message;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("group_messages")
      .update({
        media_urls: mediaUrls.map((m: { url: string }) => m.url),
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

/**
 * Deletes a group message (soft delete)
 * Only the message sender can delete their own message
 */
export const deleteGroupMessage = async (
  messageId: string,
  userId: string
): Promise<boolean> => {
  try {
    // Input validation
    if (!messageId?.trim()) {
      console.error("Invalid messageId for deleteGroupMessage:", messageId);
      return false;
    }

    if (!userId?.trim()) {
      console.error("Invalid userId for deleteGroupMessage:", userId);
      return false;
    }

    const { error } = await supabase
      .from("group_messages")
      .update({ is_deleted: true })
      .eq("id", messageId)
      .eq("sender_id", userId); // Only allow deleting own messages

    if (error) {
      console.error("Error deleting group message:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting group message:", error);
    return false;
  }
};

/**
 * Edits a group message content
 * Only the message sender can edit their own message
 */
export const editGroupMessage = async (
  messageId: string,
  userId: string,
  newContent: string
): Promise<Message | null> => {
  try {
    // Input validation
    if (!messageId?.trim()) {
      console.error("Invalid messageId for editGroupMessage:", messageId);
      return null;
    }

    if (!userId?.trim()) {
      console.error("Invalid userId for editGroupMessage:", userId);
      return null;
    }

    if (!newContent?.trim()) {
      console.error("Invalid newContent for editGroupMessage:", newContent);
      return null;
    }

    const { data, error } = await supabase
      .from("group_messages")
      .update({
        content: newContent.trim(),
        edited_at: new Date().toISOString()
      })
      .eq("id", messageId)
      .eq("sender_id", userId) // Only allow editing own messages
      .select()
      .single();

    if (error) {
      console.error("Error editing group message:", error);
      return null;
    }

    if (!data || typeof data !== 'object') {
      console.error("Invalid response data from editGroupMessage");
      return null;
    }

    return {
      ...data,
      group_conversation_id: data.conversation_id,
      conversation_id: undefined,
    } as unknown as Message;
  } catch (error) {
    console.error("Error editing group message:", error);
    return null;
  }
};
