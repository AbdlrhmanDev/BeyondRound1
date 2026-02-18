'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Play, Loader2, Users, Clock, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";
import Link from "next/link";

const MEETUP_TYPES = ["brunch", "coffee", "walk", "sports", "dinner"] as const;
const NEIGHBORHOODS = ["mitte", "prenzlauer_berg_friedrichshain", "kreuzberg_neukoelln", "charlottenburg_schoeneberg"] as const;

interface MatchingResult {
  success: boolean;
  groupsCreated: number;
  partialGroupsCreated?: number;
  usersAdded: number;
  waitlistAdded: number;
  matchesCreated: number;
  matchWeek: string;
  message?: string;
  error?: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<{ id: string; city: string; meetup_type: string; date_time: string; neighborhood: string | null; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);
  const { toast } = useToast();
  const { pathWithLocale } = useLocale();

  const fetchEvents = async () => {
    const { data } = await (supabase as any)
      .from("events")
      .select("*")
      .order("date_time", { ascending: true })
      .limit(50);
    setEvents((data as typeof events) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    const nextSaturday = new Date();
    nextSaturday.setDate(nextSaturday.getDate() + ((6 - nextSaturday.getDay() + 7) % 7) + 7);
    nextSaturday.setHours(12, 0, 0, 0);

    const { error } = await (supabase as any).from("events").insert({
      city: "Berlin",
      meetup_type: "brunch",
      date_time: nextSaturday.toISOString(),
      neighborhood: "mitte",
      max_participants: 4,
      min_participants: 3,
      status: "open",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event created" });
      fetchEvents();
    }
  };

  const handleRunMatching = async () => {
    setMatchingLoading(true);
    setMatchingResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-match-groups', {});

      if (error) {
        throw error;
      }

      const result = data as MatchingResult;
      setMatchingResult(result);

      if (result.success) {
        toast({
          title: "Matching Complete",
          description: `Created ${result.groupsCreated} groups for ${result.usersAdded} users.`,
        });
      } else {
        toast({
          title: "Matching Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMatchingResult({
        success: false,
        groupsCreated: 0,
        usersAdded: 0,
        waitlistAdded: 0,
        matchesCreated: 0,
        matchWeek: "",
        error: errorMessage,
      });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setMatchingLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground">Create meetup events and run matching</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateEvent} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
            <Button
              variant="outline"
              onClick={handleRunMatching}
              disabled={matchingLoading}
              className="gap-2"
            >
              {matchingLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {matchingLoading ? "Running..." : "Run Matching"}
            </Button>
          </div>
        </div>

        {/* Matching Results Card */}
        {matchingResult && (
          <Card className={matchingResult.success ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Matching Results
                {matchingResult.matchWeek && (
                  <Badge variant="secondary" className="ml-2">
                    Week of {matchingResult.matchWeek}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matchingResult.success ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-card border">
                    <div className="text-3xl font-bold text-primary">{matchingResult.groupsCreated}</div>
                    <div className="text-sm text-muted-foreground">Groups Created</div>
                  </div>
                  {matchingResult.partialGroupsCreated !== undefined && matchingResult.partialGroupsCreated > 0 && (
                    <div className="text-center p-4 rounded-lg bg-card border">
                      <div className="text-3xl font-bold text-amber-500">{matchingResult.partialGroupsCreated}</div>
                      <div className="text-sm text-muted-foreground">Partial Groups</div>
                    </div>
                  )}
                  <div className="text-center p-4 rounded-lg bg-card border">
                    <div className="text-3xl font-bold text-green-600">{matchingResult.usersAdded}</div>
                    <div className="text-sm text-muted-foreground">Users Matched</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-card border">
                    <div className="text-3xl font-bold text-blue-600">{matchingResult.matchesCreated}</div>
                    <div className="text-sm text-muted-foreground">New Matches</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-card border">
                    <div className="text-3xl font-bold text-orange-500">{matchingResult.waitlistAdded}</div>
                    <div className="text-sm text-muted-foreground">On Waitlist</div>
                  </div>
                </div>
              ) : (
                <div className="text-red-600 dark:text-red-400">
                  <p className="font-medium">Matching failed</p>
                  <p className="text-sm">{matchingResult.error || matchingResult.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground">No events. Create one above.</p>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <Link
                    key={e.id}
                    href={pathWithLocale(`/admin/events/${e.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <span className="font-medium capitalize">{e.meetup_type}</span>
                      <span className="text-muted-foreground mx-2">—</span>
                      <span>{e.city}</span>
                      <span className="text-muted-foreground ml-2">
                        {format(new Date(e.date_time), "EEEE, MMM d 'at' HH:mm")}
                      </span>
                    </div>
                    <Badge variant={e.status === "open" ? "default" : "secondary"}>
                      {e.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
