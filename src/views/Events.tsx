'use client';

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import { getUserBookings } from "@/services/eventService";
import type { Booking } from "@/services/eventService";
import { MEETUP_TYPE_LABELS } from "@/services/eventService";
import { format } from "date-fns";
import { Calendar, MessageSquare, Clock, MapPin, Users } from "lucide-react";

type BookingWithEvent = Booking & { event?: { id?: string; meetup_type: string; date_time: string; city: string; neighborhood?: string | null } };

export default function EventsPage() {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [openingChatFor, setOpeningChatFor] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    
    getUserBookings(user.id)
      .then((bookings) => {
        if (cancelled) return;
        console.log("Events page: Received", bookings.length, "bookings");
        // Keep bookings even if event is missing - we'll handle it in the UI
        setBookings(bookings);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error fetching bookings:", err);
        setBookings([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const now = new Date();
  const upcoming = bookings.filter((b) => {
    // Include bookings with confirmed/pending status
    // If event exists, check date; if no event, include based on status only
    if (b.event?.date_time) {
      const eventDate = new Date(b.event.date_time);
      return eventDate >= now && (b.status === "confirmed" || b.status === "pending");
    }
    // Bookings without events but with pending/confirmed status
    return b.status === "confirmed" || b.status === "pending";
  }).sort((a, b) => {
    const dateA = a.event?.date_time ? new Date(a.event.date_time).getTime() : Infinity;
    const dateB = b.event?.date_time ? new Date(b.event.date_time).getTime() : Infinity;
    return dateA - dateB;
  });
  
  const past = bookings.filter((b) => {
    // Include completed/cancelled bookings
    if (b.status === "completed" || b.status === "cancelled") return true;
    // If event exists, check if date is in the past
    if (b.event?.date_time) {
      const eventDate = new Date(b.event.date_time);
      return eventDate < now;
    }
    return false;
  }).sort((a, b) => {
    const dateA = a.event?.date_time ? new Date(a.event.date_time).getTime() : 0;
    const dateB = b.event?.date_time ? new Date(b.event.date_time).getTime() : 0;
    return dateB - dateA; // Most recent first for past events
  });

  const getLocation = (b: BookingWithEvent) => {
    const prefs = b.preferences as Record<string, unknown> | undefined;
    const area = (prefs?.neighborhood || prefs?.area) as string | undefined;
    if (area) return area;
    return b.event?.neighborhood || b.event?.city || "—";
  };

  const openGroupChat = async (b: BookingWithEvent) => {
    const eventId = b.event_id || b.event?.id;
    if (!eventId) {
      toast({ title: t("events.errorOpen", "Could not open chat"), variant: "destructive" });
      return;
    }
    setOpeningChatFor(b.id);
    try {
      const res = await fetch("/api/events/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open chat");
      if (data.conversationId) {
        navigate(`/chat/${data.conversationId}`);
      } else {
        navigate("/chat");
      }
    } catch (err) {
      toast({
        title: t("events.errorOpen", "Could not open chat"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setOpeningChatFor(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
          <Skeleton className="h-10 w-48 mb-6 mx-auto" />
          <Skeleton className="h-10 w-64 mb-6 mx-auto" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl mt-4" />
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-2">
          {t("events.yourEvents", "Your Events")}
        </h1>

        <div className="flex justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              tab === "upcoming" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {t("events.upcoming", "Upcoming")}
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              tab === "past" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {t("events.past", "Past")}
          </button>
        </div>

        {tab === "upcoming" && (
          <>
            {upcoming.length === 0 ? (
              <Card className="rounded-2xl border border-border/60">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {t("events.noUpcoming", "No upcoming meetups. Book your first.")}
                  </p>
                  <Button onClick={() => navigate("/dashboard")} className="rounded-xl">
                    {t("events.bookMeetup", "Book a meetup")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcoming.map((b) => {
                  const eventLabel = b.event?.meetup_type ? MEETUP_TYPE_LABELS[b.event.meetup_type as keyof typeof MEETUP_TYPE_LABELS] : "Meetup";
                  const isGroupReady = b.status === "confirmed";
                  return (
                    <Card key={b.id} className="rounded-2xl border border-border/60 overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <p className="font-display font-semibold text-foreground">
                            {eventLabel}
                          </p>
                          <span
                            className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                              isGroupReady ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {isGroupReady ? t("events.groupReady", "Group Ready") : t("events.booked", "Booked")}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                            {b.event?.date_time ? format(new Date(b.event.date_time), "EEEE, MMM d") : "—"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                            {b.event?.date_time ? format(new Date(b.event.date_time), "HH:mm") : "—"}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                            {getLocation(b)}
                          </div>
                          {isGroupReady && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                              {t("events.membersCount", "{{count}} members", { count: 3 })}
                            </div>
                          )}
                        </div>
                        {isGroupReady && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full rounded-xl border-amber-400 text-amber-700 hover:bg-amber-50 hover:border-amber-500 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950/30"
                            onClick={() => openGroupChat(b)}
                            disabled={openingChatFor === b.id}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {openingChatFor === b.id ? t("common.loading", "Loading…") : t("events.openChat", "Open Chat")}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "past" && (
          <>
            {past.length === 0 ? (
              <Card className="rounded-2xl border border-border/60">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {t("events.noPast", "No past meetups yet.")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {past.map((b) => (
                  <Card key={b.id} className="rounded-2xl border border-border/60">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display font-semibold text-foreground">
                            {b.event?.meetup_type ? MEETUP_TYPE_LABELS[b.event.meetup_type as keyof typeof MEETUP_TYPE_LABELS] : "Meetup"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {b.event?.date_time ? format(new Date(b.event.date_time), "EEEE, MMM d") : ""}
                          </p>
                        </div>
                        {b.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl shrink-0"
                            onClick={() => navigate(`/events/feedback/${b.id}`)}
                          >
                            {t("events.giveFeedback", "How was it?")}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
