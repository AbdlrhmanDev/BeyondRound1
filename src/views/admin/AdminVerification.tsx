'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface VerificationRequest {
  id: string;
  user_id: string;
  verification_method: string;
  file_urls: string[];
  status: string;
  created_at: string;
  profile?: { full_name: string | null; email?: string } | null;
}

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data } = await (supabase as any)
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((r: { user_id: string }) => r.user_id))] as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      setRequests(
        data.map((r: { user_id: string; [k: string]: unknown }) => ({
          ...r,
          profile: profileMap.get(r.user_id) || null,
        }))
      );
    } else {
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await (supabase as any)
      .from("verification_requests")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Verification ${status}` });
      fetchRequests();
    }
  };

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Verification</h1>
          <p className="text-muted-foreground">
            Review doctor verification requests (license, ID, employment proof)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Verification Requests
              {pending.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pending.length} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : requests.length === 0 ? (
              <p className="text-muted-foreground">
                No verification requests yet. Users submit during onboarding.
              </p>
            ) : (
              <div className="space-y-4">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {r.profile?.full_name || "Unknown"} ({r.user_id.slice(0, 8)}...)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.verification_method.replace(/_/g, " ")} ·{" "}
                        {format(new Date(r.created_at), "MMM d, yyyy")}
                      </p>
                      {r.file_urls?.length > 0 && (
                        <a
                          href={r.file_urls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View document
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          r.status === "approved"
                            ? "default"
                            : r.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {r.status}
                      </Badge>
                      {r.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(r.id, "approved")}
                            className="gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(r.id, "rejected")}
                            className="gap-1"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
