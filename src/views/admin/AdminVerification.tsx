'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, RefreshCw } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getVerificationQueue, VerificationRequest } from "@/services/adminService";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  approved: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-600",
};

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { pathWithLocale } = useLocale();

  const fetchRequests = async () => {
    setLoading(true);
    const data = await getVerificationQueue(statusFilter);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(q) ||
      r.user_id.toLowerCase().includes(q)
    );
  });

  const isOverdue = (createdAt: string, status: string) => {
    if (status !== "pending") return false;
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return hours > 48;
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-8 w-8" />
              Verification Queue
            </h1>
            <p className="text-muted-foreground">
              Review doctor verification requests
              {pendingCount > 0 && ` — ${pendingCount} pending`}
            </p>
          </div>
          <Button variant="outline" onClick={fetchRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((status) => (
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
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : filteredRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No verification requests found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Doctor</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Specialty</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">City</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Document Type</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Submitted</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/50 cursor-pointer">
                        <td className="py-3 px-2">
                          <Link
                            href={pathWithLocale(`/admin/verifications/${r.user_id}`)}
                            className="font-medium hover:underline text-primary"
                          >
                            {r.full_name || "Unknown"}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {r.specialty || "—"}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {r.city || "—"}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {r.document_type?.replace(/_/g, " ") || "—"}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={statusColors[r.status] || statusColors.pending}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          {isOverdue(r.created_at, r.status) ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : r.status === "pending" ? (
                            <span className="text-muted-foreground text-xs">Within SLA</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
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
