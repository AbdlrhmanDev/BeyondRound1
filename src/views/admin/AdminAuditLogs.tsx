'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuditLogs, AuditLog } from "@/services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  RefreshCw, ScrollText, Pencil, Ban, UserCheck, UserX, Shield, ShieldCheck,
  XCircle, AlertTriangle, Trash2, MessageSquare, Calendar, Settings, Download,
  Search, RotateCcw, Eye
} from "lucide-react";
import { format } from "date-fns";

const actionConfig: Record<string, { label: string; icon: typeof Pencil; color: string }> = {
  user_edit: { label: "Profile Edit", icon: Pencil, color: "bg-blue-500/10 text-blue-500" },
  user_ban: { label: "User Banned", icon: Ban, color: "bg-red-500/10 text-red-500" },
  user_suspend: { label: "User Suspended", icon: UserX, color: "bg-yellow-500/10 text-yellow-500" },
  user_unban: { label: "User Unbanned", icon: UserCheck, color: "bg-green-500/10 text-green-500" },
  user_delete: { label: "User Deleted", icon: Trash2, color: "bg-red-500/10 text-red-500" },
  role_grant: { label: "Role Granted", icon: Shield, color: "bg-purple-500/10 text-purple-500" },
  role_revoke: { label: "Role Revoked", icon: Shield, color: "bg-orange-500/10 text-orange-500" },
  approve_verification: { label: "Verification Approved", icon: ShieldCheck, color: "bg-green-500/10 text-green-500" },
  reject_verification: { label: "Verification Rejected", icon: XCircle, color: "bg-red-500/10 text-red-500" },
  request_reupload: { label: "Re-upload Requested", icon: RotateCcw, color: "bg-amber-500/10 text-amber-500" },
  soft_delete_user: { label: "User Soft Deleted", icon: Trash2, color: "bg-red-500/10 text-red-500" },
  restore_user: { label: "User Restored", icon: RotateCcw, color: "bg-green-500/10 text-green-500" },
  change_role: { label: "Role Changed", icon: Shield, color: "bg-purple-500/10 text-purple-500" },
  update_report: { label: "Report Updated", icon: AlertTriangle, color: "bg-amber-500/10 text-amber-500" },
  review_report: { label: "Report Reviewed", icon: Eye, color: "bg-blue-500/10 text-blue-500" },
  resolve_report: { label: "Report Resolved", icon: UserCheck, color: "bg-green-500/10 text-green-500" },
  dismiss_report: { label: "Report Dismissed", icon: XCircle, color: "bg-gray-500/10 text-gray-500" },
  warn_user: { label: "User Warned", icon: AlertTriangle, color: "bg-amber-500/10 text-amber-500" },
  cancel_event: { label: "Event Cancelled", icon: Calendar, color: "bg-red-500/10 text-red-500" },
  close_event: { label: "Event Closed", icon: Calendar, color: "bg-gray-500/10 text-gray-500" },
  reopen_event: { label: "Event Reopened", icon: Calendar, color: "bg-green-500/10 text-green-500" },
  cancel_booking: { label: "Booking Cancelled", icon: Calendar, color: "bg-red-500/10 text-red-500" },
  delete_message: { label: "Message Deleted", icon: Trash2, color: "bg-red-500/10 text-red-500" },
  remove_from_group: { label: "Removed from Group", icon: UserX, color: "bg-red-500/10 text-red-500" },
  disband_group: { label: "Group Disbanded", icon: XCircle, color: "bg-red-500/10 text-red-500" },
  send_system_message: { label: "System Message", icon: MessageSquare, color: "bg-blue-500/10 text-blue-500" },
  update_app_config: { label: "Config Updated", icon: Settings, color: "bg-purple-500/10 text-purple-500" },
  delete_feedback: { label: "Feedback Deleted", icon: Trash2, color: "bg-red-500/10 text-red-500" },
};

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = async () => {
    setIsLoading(true);
    const logsData = await getAuditLogs(200);
    setLogs(logsData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.admin_name?.toLowerCase().includes(q) ||
        log.target_name?.toLowerCase().includes(q) ||
        log.reason?.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();

  const handleExportCsv = () => {
    const headers = ["Date", "Action", "Admin", "Target", "Reason"];
    const rows = filteredLogs.map((l) => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm"),
      l.action,
      l.admin_name || "",
      l.target_name || "",
      l.reason || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ScrollText className="h-8 w-8" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground">Track all admin actions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search admin, target, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {actionConfig[action]?.label || action}
              </option>
            ))}
          </select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No audit logs found</p>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => {
                  const config = actionConfig[log.action] || actionConfig.user_edit;
                  const Icon = config.icon;

                  return (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={config.color}>{config.label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            by <span className="font-medium text-foreground">{log.admin_name}</span>
                          </span>
                          {log.target_name && (
                            <span className="text-sm text-muted-foreground">
                              &rarr; <span className="font-medium text-foreground">{log.target_name}</span>
                            </span>
                          )}
                        </div>
                        {log.reason && (
                          <p className="text-sm mt-1">
                            <span className="text-muted-foreground">Reason:</span> {log.reason}
                          </p>
                        )}
                        {Boolean(log.old_values) && Boolean(log.new_values) && typeof log.old_values === 'object' && typeof log.new_values === 'object' && (
                          <div className="mt-2 text-xs">
                            <details className="cursor-pointer">
                              <summary className="text-muted-foreground hover:text-foreground">View changes</summary>
                              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                                {Object.keys(log.new_values as Record<string, unknown>).map((key) => {
                                  const oldVal = (log.old_values as Record<string, unknown>)?.[key];
                                  const newVal = (log.new_values as Record<string, unknown>)?.[key];
                                  if (oldVal === newVal) return null;
                                  return (
                                    <div key={key} className="mb-1">
                                      <span className="text-muted-foreground">{key}:</span>{" "}
                                      <span className="text-red-500 line-through">{String(oldVal || "null")}</span>
                                      {" → "}
                                      <span className="text-green-500">{String(newVal || "null")}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLogs;
