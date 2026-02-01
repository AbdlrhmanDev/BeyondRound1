/**
 * Notification Service - Handles notification operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: unknown;
  read_at: string | null;
  created_at: string;
}

/**
 * Creates a notification
 */
export const createNotification = async (
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    link?: string | null;
    metadata?: unknown;
  }
): Promise<boolean> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for createNotification:", userId);
      return false;
    }

    if (!notification || !notification.type?.trim() || !notification.title?.trim() || !notification.message?.trim()) {
      console.error("Invalid notification data for createNotification:", notification);
      return false;
    }

    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: notification.type.trim(),
        title: notification.title.trim(),
        message: notification.message.trim(),
        link: notification.link || null,
        metadata: notification.metadata || null,
      });

    if (error) {
      console.error("Error creating notification:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
};

/**
 * Checks if a notification exists matching criteria
 */
export const checkNotificationExists = async (
  userId: string,
  type: string,
  messagePattern: string
): Promise<boolean> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for checkNotificationExists:", userId);
      return false;
    }

    if (!type?.trim()) {
      console.error("Invalid type for checkNotificationExists:", type);
      return false;
    }

    if (!messagePattern?.trim()) {
      console.error("Invalid messagePattern for checkNotificationExists:", messagePattern);
      return false;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type)
      .like("message", messagePattern)
      .maybeSingle();

    if (error) {
      console.error("Error checking notification:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking notification:", error);
    return false;
  }
};
