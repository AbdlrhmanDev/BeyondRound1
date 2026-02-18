'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, RefreshCw, Users } from "lucide-react";
import { format } from "date-fns";
import { getGroups } from "@/services/adminService";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const { pathWithLocale } = useLocale();

  const fetchGroups = async () => {
    setLoading(true);
    const data = await getGroups(statusFilter);
    setGroups(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [statusFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              Groups & Chats
            </h1>
            <p className="text-muted-foreground">{groups.length} groups</p>
          </div>
          <Button variant="outline" onClick={fetchGroups}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2">
          {["all", "active", "disbanded"].map((status) => (
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
            <CardTitle>Match Groups</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : groups.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No groups found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Members</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Week</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr key={g.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <Link
                            href={pathWithLocale(`/admin/groups/${g.id}`)}
                            className="font-medium hover:underline text-primary"
                          >
                            {g.name || g.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground capitalize">{g.group_type}</td>
                        <td className="py-3 px-2">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {g.member_count}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{g.match_week || "—"}</td>
                        <td className="py-3 px-2">
                          <Badge variant={g.status === "active" ? "default" : "secondary"}>
                            {g.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {format(new Date(g.created_at), "MMM d, yyyy")}
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
