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

export interface SmartFeedbackData {
  user_id: string | null;
  context_type: 'group_completed' | 'after_meetup' | 'profile_suggestion' | 'general';
  rating: number;
  feedback_chips: string[];
  additional_text?: string;
  group_id?: string;
  meetup_id?: string;
  page_url?: string;
}

/**
 * Submits user feedback (legacy format)
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

/**
 * Submits smart feedback with structured data
 */
export const submitSmartFeedback = async (feedback: SmartFeedbackData): Promise<boolean> => {
  try {
    // Input validation
    if (!feedback) {
      console.error("Invalid feedback data for submitSmartFeedback");
      return false;
    }

    if (!feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
      console.error("Invalid rating for submitSmartFeedback:", feedback.rating);
      return false;
    }

    // Build a human-readable message summary for backwards compatibility
    const chipLabels = feedback.feedback_chips.join(', ');
    const messageSummary = [
      `Rating: ${feedback.rating}/5`,
      chipLabels ? `Topics: ${chipLabels}` : null,
      feedback.additional_text ? `Comment: ${feedback.additional_text}` : null,
    ].filter(Boolean).join(' | ');

    const { error } = await supabase
      .from("feedback")
      .insert({
        user_id: feedback.user_id,
        category: feedback.context_type,
        message: messageSummary,
        page_url: feedback.page_url || null,
        rating: feedback.rating,
        feedback_chips: feedback.feedback_chips,
        context_type: feedback.context_type,
        additional_text: feedback.additional_text?.trim() || null,
        group_id: feedback.group_id || null,
        meetup_id: feedback.meetup_id || null,
      });

    if (error) {
      console.error("Error submitting smart feedback:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error submitting smart feedback:", error);
    return false;
  }
};

/**
 * Gets feedback statistics for a specific context
 */
export const getFeedbackStats = async (contextType?: string): Promise<{
  averageRating: number;
  totalCount: number;
  ratingDistribution: Record<number, number>;
} | null> => {
  try {
    // Note: rating column may not be in generated types but exists in DB
    let query = supabase!
      .from("feedback")
      .select("rating")
      .not("rating", "is", null);

    if (contextType) {
      query = query.eq("context_type", contextType);
    }

    const { data, error } = await query as { data: { rating: number }[] | null; error: unknown };

    if (error) {
      console.error("Error fetching feedback stats:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        averageRating: 0,
        totalCount: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const ratings = data.map(f => f.rating as number);
    const totalCount = ratings.length;
    const averageRating = ratings.reduce((a, b) => a + b, 0) / totalCount;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      ratingDistribution[r] = (ratingDistribution[r] || 0) + 1;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalCount,
      ratingDistribution,
    };
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return null;
  }
};
