'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, RefreshCw, Users, Shuffle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getGroups } from "@/services/adminService";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface MatchingResult {
  ok: boolean;
  matchWeek: string;
  totalGroupsCreated: number;
  totalUsersMatched: number;
  totalSkipped: number;
  message: string;
  byDay: Record<string, { booked: number; grouped: number }>;
  groupsCreated: { day: string; groupId: string; memberCount: number; genderComposition: string; groupType: string; isPartial: boolean }[];
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchingResult | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const { pathWithLocale } = useLocale();
  const { session } = useAuth();

  const fetchGroups = async () => {
    setLoading(true);
    const data = await getGroups(statusFilter);
    setGroups(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [statusFilter]);

  const handleRunMatching = async () => {
    if (!session?.access_token) return;
    setMatching(true);
    setMatchResult(null);
    setMatchError(null);

    try {
      const res = await fetch('/api/admin/run-matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json() as MatchingResult & { error?: string };

      if (!res.ok) {
        setMatchError(data.error ?? 'Matching failed. Please try again.');
      } else {
        setMatchResult(data);
        // Refresh group list to include new groups
        fetchGroups();
      }
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setMatching(false);
    }
  };

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
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleRunMatching}
              disabled={matching}
            >
              {matching
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running…</>
                : <><Shuffle className="h-4 w-4 mr-2" />Run Weekend Matching</>
              }
            </Button>
            <Button variant="outline" onClick={fetchGroups}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Matching result banner */}
        {matchResult && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-green-800">{matchResult.message}</p>
                  <p className="text-sm text-green-700">
                    {matchResult.totalGroupsCreated} group{matchResult.totalGroupsCreated !== 1 ? 's' : ''} created
                    · {matchResult.totalUsersMatched} users matched
                    {matchResult.totalSkipped > 0 && ` · ${matchResult.totalSkipped} skipped`}
                    · Week of {matchResult.matchWeek}
                  </p>
                </div>
              </div>

              {/* Per-day breakdown */}
              {matchResult.byDay && (
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['friday', 'saturday', 'sunday'] as const).map((day) => {
                    const d = matchResult.byDay[day];
                    if (!d) return null;
                    return (
                      <div key={day} className="bg-white border border-green-200 rounded-lg px-3 py-2 text-center">
                        <p className="text-xs font-semibold text-green-700 capitalize">{day}</p>
                        <p className="text-lg font-bold text-green-900">{d.grouped}</p>
                        <p className="text-[11px] text-green-600">of {d.booked} booked</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Group badges */}
              <div className="flex flex-wrap gap-2">
                {matchResult.groupsCreated.map((g) => (
                  <Badge key={g.groupId} variant="outline" className="capitalize border-green-300 text-green-700 text-xs">
                    {g.day} · {g.memberCount} · {g.genderComposition}
                    {g.isPartial && ' · partial'}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {matchError && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{matchError}</p>
              </div>
            </CardContent>
          </Card>
        )}

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
