'use client';

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type EmailMode = string;

interface TriggerResult {
  sent: number;
  skipped: number;
  mode: string;
}

interface EmailSection {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  emails: {
    mode: EmailMode;
    label: string;
    description: string;
  }[];
}

const sections: EmailSection[] = [
  {
    id: "launch",
    title: "Launch Emails",
    description: "Manually triggered — sent once per waitlist member.",
    endpoint: "/api/admin/launch",
    emails: [
      { mode: "l1", label: "L1 — Broadcast", description: "\"Your spot is ready\" to all waitlist" },
      { mode: "l2", label: "L2 — Follow-up", description: "48h nudge to non-signups" },
      { mode: "l3", label: "L3 — Verify nudge", description: "Unverified signups after 24h" },
      { mode: "all", label: "All (L1 + L2 + L3)", description: "Run full launch sequence" },
    ],
  },
  {
    id: "engagement",
    title: "Engagement Emails",
    description: "Also runs automatically daily at 8 AM UTC via cron.",
    endpoint: "/api/admin/engagement",
    emails: [
      { mode: "e1", label: "E1 — Verified welcome", description: "Verification approved, not yet emailed" },
      { mode: "e2", label: "E2 — Match welcome", description: "Added to first group, not yet emailed" },
      { mode: "e3", label: "E3 — Follow-up", description: "7 days after group created" },
      { mode: "all", label: "All (E1 + E2 + E3)", description: "Run full engagement sequence" },
    ],
  },
];

export default function AdminEmails() {
  const { session } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TriggerResult | null>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const trigger = async (endpoint: string, mode: EmailMode) => {
    const key = `${endpoint}:${mode}`;
    if (!session?.access_token) return;

    setLoading((p) => ({ ...p, [key]: true }));
    setResults((p) => ({ ...p, [key]: null }));
    setErrors((p) => ({ ...p, [key]: null }));

    try {
      const res = await fetch(`${endpoint}?mode=${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((p) => ({ ...p, [key]: data.error ?? "Request failed" }));
      } else {
        setResults((p) => ({ ...p, [key]: data }));
      }
    } catch (err) {
      setErrors((p) => ({
        ...p,
        [key]: err instanceof Error ? err.message : "Network error",
      }));
    } finally {
      setLoading((p) => ({ ...p, [key]: false }));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Email Campaigns
          </h1>
          <p className="text-muted-foreground">Manually trigger email sequences or monitor cron-based sends.</p>
        </div>

        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1.5">
                    {section.id === "engagement" && (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {section.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.emails.map((email) => {
                  const key = `${section.endpoint}:${email.mode}`;
                  const isLoading = loading[key];
                  const result = results[key];
                  const error = errors[key];
                  const isAll = email.mode === "all";

                  return (
                    <div
                      key={email.mode}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                        isAll ? "border-primary/30 bg-primary/5" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{email.label}</p>
                        <p className="text-xs text-muted-foreground">{email.description}</p>
                      </div>

                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        {result && (
                          <div className="flex items-center gap-1.5 text-xs text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{result.sent} sent, {result.skipped} skipped</span>
                          </div>
                        )}
                        {error && (
                          <div className="flex items-center gap-1.5 text-xs text-destructive max-w-[180px]">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{error}</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant={isAll ? "default" : "outline"}
                          disabled={isLoading || !session?.access_token}
                          onClick={() => trigger(section.endpoint, email.mode)}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Trigger"
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
