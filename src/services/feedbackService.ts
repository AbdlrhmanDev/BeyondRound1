/**
 * Feedback Service - Handles feedback submission
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export interface FeedbackData {
  user_id: string | null;
  category: string;
  message: string;
  page_url: string;
}

/**
 * Submits user feedback
 */
export const submitFeedback = async (feedback: FeedbackData): Promise<boolean> => {
  try {
    // Input validation
    if (!feedback) {
      console.error("Invalid feedback data for submitFeedback");
      return false;
    }

    if (!feedback.category?.trim()) {
      console.error("Invalid category for submitFeedback:", feedback.category);
      return false;
    }

    if (!feedback.message?.trim()) {
      console.error("Invalid message for submitFeedback:", feedback.message);
      return false;
    }

    const { error } = await supabase
      .from("feedback")
      .insert({
        user_id: feedback.user_id,
        category: feedback.category.trim(),
        message: feedback.message.trim(),
        page_url: feedback.page_url || null,
      });

    if (error) {
      console.error("Error submitting feedback:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return false;
  }
};
