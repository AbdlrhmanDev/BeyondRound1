'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getReports, Report } from "@/services/adminService";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  reviewed: "bg-blue-500/10 text-blue-600",
  resolved: "bg-green-500/10 text-green-600",
  dismissed: "bg-gray-500/10 text-gray-600",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const { pathWithLocale } = useLocale();

  const fetchReports = async () => {
    setLoading(true);
    const data = await getReports(statusFilter);
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8" />
              Reports & Safety
            </h1>
            <p className="text-muted-foreground">
              Triage user reports{pendingCount > 0 && ` — ${pendingCount} pending`}
            </p>
          </div>
          <Button variant="outline" onClick={fetchReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2">
          {["all", "pending", "reviewed", "resolved", "dismissed"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : reports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reports found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Reporter</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Reported User</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Reason</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Submitted</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">{r.reporter_name || r.reporter_id?.slice(0, 8)}</td>
                        <td className="py-3 px-2">
                          <Link
                            href={pathWithLocale(`/admin/reports/${r.id}`)}
                            className="font-medium hover:underline text-primary"
                          >
                            {r.reported_name || r.reported_id?.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground max-w-xs truncate">{r.reason}</td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={statusColors[r.status] || statusColors.pending}>
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
