'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";
import { getReportDetail, updateReportStatus, banUserRpc, Report } from "@/services/adminService";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  reviewed: "bg-blue-500/10 text-blue-600",
  resolved: "bg-green-500/10 text-green-600",
  dismissed: "bg-gray-500/10 text-gray-600",
};

export default function AdminReportDetailPage() {
  const params = useParams();
  const reportId = params?.id as string;
  const { pathWithLocale } = useLocale();
  const { toast } = useToast();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState(""); // Used only for the audit log reason, not stored in user_reports
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const data = await getReportDetail(reportId);
    setReport(data);
    // admin_notes not stored in user_reports table
    setLoading(false);
  };

  useEffect(() => {
    if (reportId) fetchReport();
  }, [reportId]);

  const handleAction = async (status: string) => {
    setActionLoading(true);
    const success = await updateReportStatus(reportId, status, adminNotes || undefined);
    setActionLoading(false);

    if (success) {
      toast({ title: "Success", description: `Report ${status}` });
      fetchReport();
    } else {
      toast({ title: "Error", description: "Failed to update report", variant: "destructive" });
    }
  };

  const handleBanUser = async () => {
    if (!report?.reported_id) return;
    setActionLoading(true);
    const success = await banUserRpc(report.reported_id, `Banned due to report: ${report.reason}`);
    setActionLoading(false);

    if (success) {
      toast({ title: "User Banned", description: `${report.reported_name || "User"} has been banned` });
    } else {
      toast({ title: "Error", description: "Failed to ban user", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!report) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Report not found</p>
          <Link href={pathWithLocale("/admin/reports")}>
            <Button variant="link" className="mt-4">Back to reports</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={pathWithLocale("/admin/reports")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8" />
              Report Detail
            </h1>
          </div>
          <Badge className={statusColors[report.status] || statusColors.pending}>
            {report.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Reporter" value={report.reporter_name || report.reporter_id?.slice(0, 8)} />
              <InfoRow label="Reported User" value={report.reported_name || report.reported_id?.slice(0, 8)} />
              <InfoRow label="Reason" value={report.reason} />
              <InfoRow label="Submitted" value={report.created_at ? format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a") : null} />
              {report.description && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Description</span>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{report.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this report..."
                  className="mt-2 min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Report Actions</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction("reviewed")}
                    disabled={actionLoading}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Mark Reviewed
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction("resolved")}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction("dismissed")}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">User Actions</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={pathWithLocale(`/admin/users/${report.reported_id}`)}>
                    <Button size="sm" variant="outline">View User Profile</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBanUser}
                    disabled={actionLoading}
                  >
                    Ban User
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
