/**
 * Evaluation Service - Handles group evaluation operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export interface GroupEvaluation {
  id?: string;
  user_id: string;
  group_id: string;
  match_week: string;
  met_in_person: boolean;
  meeting_rating: number | null;
  real_connection: boolean | null;
  feedback_text: string | null;
  photos_urls: string[] | null;
}

/**
 * Gets existing evaluation for a group
 */
export const getEvaluation = async (
  userId: string,
  groupId: string
): Promise<GroupEvaluation | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getEvaluation:", userId);
      return null;
    }

    if (!groupId?.trim()) {
      console.error("Invalid groupId for getEvaluation:", groupId);
      return null;
    }

    const { data, error } = await supabase
      .from("group_evaluations")
      .select("id, met_in_person, meeting_rating, real_connection, feedback_text, photos_urls")
      .eq("user_id", userId)
      .eq("group_id", groupId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching evaluation:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      user_id: userId,
      group_id: groupId,
      match_week: "",
      met_in_person: data.met_in_person,
      meeting_rating: data.meeting_rating,
      real_connection: data.real_connection,
      feedback_text: data.feedback_text,
      photos_urls: data.photos_urls,
    };
  } catch (error) {
    console.error("Error fetching evaluation:", error);
    return null;
  }
};

/**
 * Submits group evaluation
 */
export const submitEvaluation = async (evaluation: GroupEvaluation): Promise<boolean> => {
  try {
    // Input validation
    if (!evaluation) {
      console.error("Invalid evaluation data for submitEvaluation");
      return false;
    }

    if (!evaluation.user_id?.trim()) {
      console.error("Invalid user_id for submitEvaluation:", evaluation.user_id);
      return false;
    }

    if (!evaluation.group_id?.trim()) {
      console.error("Invalid group_id for submitEvaluation:", evaluation.group_id);
      return false;
    }

    const { error } = await supabase
      .from("group_evaluations")
      .upsert({
        user_id: evaluation.user_id,
        group_id: evaluation.group_id,
        match_week: evaluation.match_week,
        met_in_person: evaluation.met_in_person,
        meeting_rating: evaluation.meeting_rating,
        real_connection: evaluation.real_connection,
        feedback_text: evaluation.feedback_text || null,
        photos_urls: evaluation.photos_urls || null,
      });

    if (error) {
      console.error("Error submitting evaluation:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error submitting evaluation:", error);
    return false;
  }
};

/**
 * Checks if user has already submitted evaluation
 */
export const hasSubmittedEvaluation = async (
  userId: string,
  groupId: string
): Promise<boolean> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for hasSubmittedEvaluation:", userId);
      return false;
    }

    if (!groupId?.trim()) {
      console.error("Invalid groupId for hasSubmittedEvaluation:", groupId);
      return false;
    }

    const { data, error } = await supabase
      .from("group_evaluations")
      .select("id")
      .eq("user_id", userId)
      .eq("group_id", groupId)
      .maybeSingle();

    if (error) {
      console.error("Error checking evaluation:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking evaluation:", error);
    return false;
  }
};
