'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/admin/AdminLayout";
import { getMatches, getMatchGroups, Match, MatchGroup } from "@/services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Heart, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  accepted: "bg-green-500/10 text-green-500",
  rejected: "bg-red-500/10 text-red-500",
  active: "bg-blue-500/10 text-blue-500",
};

const AdminMatches = () => {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<MatchGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [matchesData, groupsData] = await Promise.all([
      getMatches(100),
      getMatchGroups(),
    ]);

    setMatches(matchesData);
    setGroups(groupsData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const matchStats = {
    total: matches.length,
    pending: matches.filter((m) => m.status === "pending").length,
    accepted: matches.filter((m) => m.status === "accepted").length,
    avgScore: matches.length
      ? Math.round(
          matches.reduce((sum, m) => sum + (m.match_score || 0), 0) / matches.length
        )
      : 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Matches & Groups</h1>
            <p className="text-muted-foreground">Manage user connections</p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{matchStats.total}</div>
              <p className="text-sm text-muted-foreground">Total Matches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-500">{matchStats.pending}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{matchStats.accepted}</div>
              <p className="text-sm text-muted-foreground">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{matchStats.avgScore}%</div>
              <p className="text-sm text-muted-foreground">Avg Score</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="matches">
          <TabsList>
            <TabsTrigger value="matches" className="gap-2">
              <Heart className="h-4 w-4" />
              1:1 Matches
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <Users className="h-4 w-4" />
              Groups ({groups.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">{t("common.loading")}</p>
                ) : matches.length === 0 ? (
                  <p className="text-muted-foreground">No matches found</p>
                ) : (
                  <div className="space-y-2">
                    {matches.slice(0, 20).map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="font-mono text-xs text-muted-foreground">
                              {match.user_id.slice(0, 8)}...
                            </span>
                            <span className="mx-2">↔</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {match.matched_user_id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {match.match_score && (
                            <span className="text-sm font-medium">
                              {match.match_score}%
                            </span>
                          )}
                          <Badge className={statusColors[match.status] || ""}>
                            {match.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(match.created_at), "MMM d")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <p className="text-muted-foreground col-span-full">{t("common.loading")}</p>
              ) : groups.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No groups found
                  </CardContent>
                </Card>
              ) : (
                groups.map((group) => (
                  <Card key={group.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">
                          {group.name || `Group ${group.id.slice(0, 6)}`}
                        </h3>
                        <Badge className={statusColors[group.status] || ""}>
                          {group.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {group.member_count} members
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Week of {format(new Date(group.match_week), "MMM d, yyyy")}
                        </p>
                        <p>Type: {group.group_type}</p>
                        {group.gender_composition && (
                          <p>Composition: {group.gender_composition}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMatches;
