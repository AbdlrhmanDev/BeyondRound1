import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch email notification preference for a user
 */
export async function getEmailNotifications(
  userId: string
): Promise<boolean | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("email_notifications")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If no settings exist yet, return default
    if (error.code === "PGRST116") {
      return true; // Default to enabled
    }
    console.error("[getEmailNotifications] Error:", error.message);
    return null;
  }

  return data?.email_notifications ?? true;
}

/**
 * Update email notification preference for a user
 */
export async function updateEmailNotifications(
  userId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  // Upsert to handle case where settings don't exist yet
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: userId, email_notifications: enabled },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[updateEmailNotifications] Error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
