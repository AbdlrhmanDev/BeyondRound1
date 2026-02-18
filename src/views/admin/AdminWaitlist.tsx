'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListChecks, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { getWaitlist, getSurveySubmissions } from "@/services/adminService";

export default function AdminWaitlistPage() {
  const [activeTab, setActiveTab] = useState<"waitlist" | "surveys">("waitlist");
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === "waitlist") {
      const data = await getWaitlist();
      setWaitlist(data);
    } else {
      const data = await getSurveySubmissions();
      setSurveys(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ListChecks className="h-8 w-8" />
              Waitlist & Surveys
            </h1>
            <p className="text-muted-foreground">View waitlist entries and survey submissions</p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === "waitlist" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("waitlist")}
          >
            Waitlist
          </Button>
          <Button
            variant={activeTab === "surveys" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("surveys")}
          >
            Survey Submissions
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "waitlist" ? `Waitlist (${waitlist.length})` : `Surveys (${surveys.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : activeTab === "waitlist" ? (
              waitlist.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No waitlist entries</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">City</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map((w: any) => (
                        <tr key={w.id} className="border-b">
                          <td className="py-3 px-2">{w.email || "—"}</td>
                          <td className="py-3 px-2">{w.full_name || w.name || "—"}</td>
                          <td className="py-3 px-2 text-muted-foreground">{w.city || "—"}</td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {w.created_at ? format(new Date(w.created_at), "MMM d, yyyy") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              surveys.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No survey submissions</p>
              ) : (
                <div className="space-y-4">
                  {surveys.map((s: any) => (
                    <div key={s.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{s.survey_type || "general"}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {s.created_at ? format(new Date(s.created_at), "MMM d, yyyy") : "—"}
                        </span>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(s.responses || s.data || s, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
