import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type AuditAction = 
  | "user_edit"
  | "user_ban"
  | "user_suspend"
  | "user_unban"
  | "user_delete"
  | "role_grant"
  | "role_revoke";

interface AuditLogEntry {
  action: AuditAction;
  targetUserId?: string;
  targetTable?: string;
  targetId?: string;
  oldValues?: Json;
  newValues?: Json;
  reason?: string;
}

export const logAdminAction = async (entry: AuditLogEntry): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("No authenticated user for audit log");
    return false;
  }

  const { error } = await supabase.from("admin_audit_logs").insert([{
    admin_id: user.id,
    action: entry.action,
    target_user_id: entry.targetUserId || null,
    target_table: entry.targetTable || null,
    target_id: entry.targetId || null,
    old_values: entry.oldValues || null,
    new_values: entry.newValues || null,
    reason: entry.reason || null,
  }]);

  if (error) {
    console.error("Failed to create audit log:", error);
    return false;
  }

  return true;
};
