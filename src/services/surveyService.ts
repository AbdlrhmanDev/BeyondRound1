/**
 * Survey Service - Handles quiz/survey submissions (second funnel)
 */

import { supabase } from "@/integrations/supabase/client";

export interface SurveySubmission {
  email: string;
  answers: Record<string, string | string[]>;
}

/**
 * Submits survey/quiz response
 */
export const submitSurvey = async (
  data: SurveySubmission
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!data.email?.trim()) {
      return { success: false, error: "Email is required" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: "Invalid email format" };
    }

    const { error } = await supabase.from("survey_submissions").insert({
      email: data.email.trim().toLowerCase(),
      answers: data.answers || {},
    });

    if (error) {
      console.error("Error submitting survey:", error);
      return { success: false, error: "Failed to submit. Please try again." };
    }
    return { success: true };
  } catch (err) {
    console.error("Survey submit error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
};
