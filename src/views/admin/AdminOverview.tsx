'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, MessageSquare, Heart, UsersRound, TrendingUp, TrendingDown,
  ShieldCheck, AlertTriangle, ListChecks
} from "lucide-react";
import { getSupabaseClient, supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalUsers: number;
  totalFeedback: number;
  totalMatches: number;
  totalGroups: number;
  pendingMatches: number;
  acceptedMatches: number;
  pendingVerifications: number;
  openReports: number;
  activeGroups: number;
  verifiedUsers: number;
  waitlistCount: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, totalFeedback: 0, totalMatches: 0, totalGroups: 0,
    pendingMatches: 0, acceptedMatches: 0, pendingVerifications: 0,
    openReports: 0, activeGroups: 0, verifiedUsers: 0, waitlistCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const results = await Promise.allSettled([
        getSupabaseClient().from("profiles").select("*", { count: "exact", head: true }),
        getSupabaseClient().from("feedback").select("*", { count: "exact", head: true }),
        getSupabaseClient().from("matches").select("*", { count: "exact", head: true }),
        getSupabaseClient().from("match_groups").select("*", { count: "exact", head: true }),
        getSupabaseClient().from("matches").select("*", { count: "exact", head: true }).eq("status", "pending"),
        getSupabaseClient().from("matches").select("*", { count: "exact", head: true }).eq("status", "accepted"),
        (supabase as any).from("verification_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("user_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        getSupabaseClient().from("match_groups").select("*", { count: "exact", head: true }).eq("status", "active"),
        getSupabaseClient().from("profiles").select("*", { count: "exact", head: true }).eq("verification_status", "approved"),
        (supabase as any).from("waitlist").select("*", { count: "exact", head: true }),
      ]);

      const getCount = (result: PromiseSettledResult<any>): number => {
        if (result.status === "fulfilled" && !result.value.error) return result.value.count || 0;
        return 0;
      };

      setStats({
        totalUsers: getCount(results[0]),
        totalFeedback: getCount(results[1]),
        totalMatches: getCount(results[2]),
        totalGroups: getCount(results[3]),
        pendingMatches: getCount(results[4]),
        acceptedMatches: getCount(results[5]),
        pendingVerifications: getCount(results[6]),
        openReports: getCount(results[7]),
        activeGroups: getCount(results[8]),
        verifiedUsers: getCount(results[9]),
        waitlistCount: getCount(results[10]),
      });
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: "Verified Users", value: stats.verifiedUsers, icon: ShieldCheck, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "Pending Verifications", value: stats.pendingVerifications, icon: ShieldCheck, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { title: "Open Reports", value: stats.openReports, icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-500/10" },
    { title: "Active Groups", value: stats.activeGroups, icon: UsersRound, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "Total Matches", value: stats.totalMatches, icon: Heart, color: "text-red-500", bgColor: "bg-red-500/10" },
    { title: "Feedback", value: stats.totalFeedback, icon: MessageSquare, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome to the admin dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? "..." : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Matches</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{isLoading ? "..." : stats.pendingMatches}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting user response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Accepted Matches</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{isLoading ? "..." : stats.acceptedMatches}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully connected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Waitlist</CardTitle>
              <ListChecks className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{isLoading ? "..." : stats.waitlistCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Waiting to join</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
