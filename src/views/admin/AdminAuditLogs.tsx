'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAuditLogs, AuditLog } from "@/services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, History, Pencil, Ban, UserCheck, UserX, Shield } from "lucide-react";
import { format } from "date-fns";

const actionConfig: Record<string, { label: string; icon: typeof Pencil; color: string }> = {
  user_edit: { label: "Profile Edit", icon: Pencil, color: "bg-blue-500/10 text-blue-500" },
  user_ban: { label: "User Banned", icon: Ban, color: "bg-red-500/10 text-red-500" },
  user_suspend: { label: "User Suspended", icon: UserX, color: "bg-yellow-500/10 text-yellow-500" },
  user_unban: { label: "User Unbanned", icon: UserCheck, color: "bg-green-500/10 text-green-500" },
  role_grant: { label: "Role Granted", icon: Shield, color: "bg-purple-500/10 text-purple-500" },
  role_revoke: { label: "Role Revoked", icon: Shield, color: "bg-orange-500/10 text-orange-500" },
};

const AdminAuditLogs = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    const logsData = await getAuditLogs(100);
    setLogs(logsData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground">Track all admin actions</p>
          </div>
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">{t("common.loading")}</p>
            ) : logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No audit logs yet</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => {
                  const config = actionConfig[log.action] || actionConfig.user_edit;
                  const Icon = config.icon;

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                    >
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
                              → <span className="font-medium text-foreground">{log.target_name}</span>
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
                              <summary className="text-muted-foreground hover:text-foreground">
                                View changes
                              </summary>
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
