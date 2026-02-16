'use client';

import { useState, useCallback, useEffect } from "react";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Heart,
  MapPin,
  Stethoscope,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Coffee,
  Archive,
  Lock,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserGroups } from "@/services/matchService";
import { getActiveBookingForWeekend } from "@/services/eventService";
import type { Booking, Event } from "@/services/eventService";
import { getProfile } from "@/services/profileService";
import { submitEvaluation, hasSubmittedEvaluation } from "@/services/evaluationService";
import type { MatchGroup, GroupMember } from "@/types/match";

// ─── Derived gathering state ────────────────────────────
type GatheringState = "loading" | "none" | "reserved" | "matched" | "completed";

// ─── Helpers ────────────────────────────────────────────
function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isCurrentWeek(matchWeek: string): boolean {
  const now = new Date();
  const mw = new Date(matchWeek);
  // Same ISO week: within 7 days and same Monday
  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };
  const nowMonday = getMonday(now);
  const mwMonday = getMonday(mw);
  return nowMonday.toDateString() === mwMonday.toDateString();
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function getDayOfWeek(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  } catch {
    return "";
  }
}

function getSharedInterests(members: GroupMember[]): string[] {
  if (members.length === 0) return [];

  // Collect all interest categories from preferences
  const allInterests = members.map((m) => {
    const prefs = m.preferences;
    if (!prefs) return [] as string[];
    return [
      ...(prefs.sports || []),
      ...(prefs.culture_interests || []),
      ...(prefs.lifestyle || []),
    ];
  });

  if (allInterests.length === 0) return [];

  // Find intersection
  const first = new Set(allInterests[0]);
  const shared = allInterests.slice(1).reduce((acc, interests) => {
    const set = new Set(interests);
    return new Set([...acc].filter((i) => set.has(i)));
  }, first);

  return [...shared].slice(0, 5);
}

// ─── Past group type for display ────────────────────────
interface PastGroupDisplay {
  id: string;
  day: string;
  date: string;
  dateNum: string;
  city: string;
  type: string;
  members: { initials: string; name: string; specialty: string }[];
  venue: string;
  conversationId?: string;
  matchWeek: string;
}

// ─── Empty State (no gathering chosen) ──────────────────
function EmptyGatheringState({ onGoHome }: { onGoHome: () => void }) {
  return (
    <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
      <CardContent className="py-12 px-6 text-center space-y-5">
        <div className="mx-auto h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
          <Calendar className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground mb-1">
            No gathering yet
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose a day on Home to join this weekend's gathering.
          </p>
        </div>
        <Button
          onClick={onGoHome}
          className="h-12 px-8 rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-sm active:scale-[0.98] transition-all"
        >
          Choose a day
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Reserved State (waiting for Thursday reveal) ───────
function ReservedGatheringCard({
  booking,
  userInitials,
}: {
  booking: Booking & { event?: Event };
  userInitials: string;
}) {
  const eventDate = booking.event?.date_time
    ? formatDate(booking.event.date_time)
    : "This weekend";
  const dayName = booking.event?.date_time
    ? getDayOfWeek(booking.event.date_time)
    : "";
  const neighborhood = booking.event?.neighborhood || "Berlin";
  const meetupType = booking.event?.meetup_type || "gathering";

  return (
    <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-primary/80 via-accent to-[hsl(15,60%,82%)]" />
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              Your {dayName} {meetupType}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {eventDate} · {neighborhood}
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
            Reserved
          </Badge>
        </div>

        {/* Placeholder avatars */}
        <div className="flex items-center justify-center gap-3 py-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 w-14 rounded-full border-[3px] border-card bg-muted flex items-center justify-center"
            >
              <span className="text-muted-foreground/50 text-lg font-medium">?</span>
            </div>
          ))}
          <div className="h-14 w-14 rounded-full border-[3px] border-accent bg-accent/10 flex items-center justify-center">
            <span className="text-accent text-xs font-semibold">{userInitials}</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your group will be revealed on <strong className="text-foreground">Thursday</strong>.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Group reveal: Thursday evening
          </div>
        </div>

        {/* Day & time info */}
        <div className="flex items-center gap-4 justify-center text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {eventDate}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {neighborhood}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Matched State (full group reveal) ──────────────────
function MatchedGatheringCard({
  group,
  onOpenChat,
}: {
  group: MatchGroup;
  onOpenChat: () => void;
}) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const sharedInterests = getSharedInterests(group.members);
  const matchDate = formatDate(group.match_week);

  return (
    <div className="space-y-4">
      {/* Shared interests */}
      {sharedInterests.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Heart className="h-4 w-4 text-accent shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">You all enjoy:</span>
          {sharedInterests.map((interest) => (
            <Badge key={interest} variant="secondary" className="text-xs bg-accent/10 text-accent border-none">
              {interest}
            </Badge>
          ))}
        </div>
      )}

      {/* Member cards */}
      <div className="space-y-4">
        {group.members.map((member, idx) => {
          const isExpanded = expandedMember === member.user_id;
          const name = member.profile.full_name || "Doctor";
          const initials = getInitials(member.profile.full_name);
          const specialty = member.preferences?.specialty || "";
          const city = member.profile.city || member.profile.neighborhood || "";

          // Combine all interests for expanded view
          const interests = [
            ...(member.preferences?.sports || []),
            ...(member.preferences?.culture_interests || []),
            ...(member.preferences?.lifestyle || []),
          ];

          return (
            <Card
              key={member.user_id}
              className="rounded-[22px] bg-card border border-border shadow-sm overflow-hidden animate-fade-in"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-background shadow-sm">
                    {member.profile.avatar_url && (
                      <AvatarImage src={member.profile.avatar_url} alt={name} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground truncate">
                      {name}
                    </h3>
                    {specialty && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{specialty}</span>
                      </div>
                    )}
                    {city && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {interests.length > 0 && (
                  <>
                    <button
                      onClick={() => setExpandedMember(isExpanded ? null : member.user_id)}
                      className="flex items-center gap-1 text-xs text-accent font-medium py-1 min-h-[44px]"
                    >
                      {isExpanded ? "Less" : "More about"} {name.split(" ").pop()}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="space-y-3 animate-fade-in">
                        <div className="flex flex-wrap gap-1.5">
                          {interests.map((interest) => (
                            <Badge key={interest} variant="outline" className="text-xs border-border">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Open chat CTA */}
      {group.conversation_id && (
        <Button
          onClick={onOpenChat}
          className="w-full h-14 rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-base shadow-sm active:scale-[0.98] transition-all"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Open group chat
        </Button>
      )}

      {/* View details accordion */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center justify-center gap-1.5 text-xs text-accent font-medium w-full min-h-[44px]"
      >
        {showDetails ? "Hide" : "View"} details
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
      </button>

      {showDetails && (
        <div className="space-y-2 p-4 rounded-[14px] bg-muted/30 border border-border text-sm text-muted-foreground animate-fade-in">
          <p>
            <strong className="text-foreground">Group:</strong> {group.name || `${group.group_type} group`}
          </p>
          <p>
            <strong className="text-foreground">Week of:</strong> {matchDate}
          </p>
          <p>
            <strong className="text-foreground">Members:</strong> {group.member_count || group.members.length + 1} (including you)
          </p>
          <p>
            <strong className="text-foreground">What to expect:</strong> A relaxed café gathering
            with your group. No agenda, just good company.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Completed State (rate + group summary) ─────────────
function CompletedGatheringCard({
  group,
  userId,
  alreadyEvaluated,
}: {
  group: MatchGroup;
  userId: string;
  alreadyEvaluated: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(alreadyEvaluated);
  const [sending, setSending] = useState(false);

  const handleSendFeedback = useCallback(async () => {
    if (rating === 0) return;
    setSending(true);

    const success = await submitEvaluation({
      user_id: userId,
      group_id: group.id,
      match_week: group.match_week,
      met_in_person: true,
      meeting_rating: rating,
      real_connection: rating >= 4,
      feedback_text: null,
      photos_urls: null,
    });

    setSending(false);
    if (success) setFeedbackSent(true);
  }, [rating, userId, group.id, group.match_week]);

  return (
    <div className="space-y-4">
      <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-primary/80 via-accent to-[hsl(15,60%,82%)]" />
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">
                {group.name || `${group.group_type} gathering`}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatDate(group.match_week)}
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-none text-xs">
              Completed
            </Badge>
          </div>

          {/* Members summary */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {group.members.slice(0, 4).map((m) => (
                <Avatar key={m.user_id} className="h-9 w-9 ring-2 ring-background">
                  {m.profile.avatar_url && (
                    <AvatarImage src={m.profile.avatar_url} alt={m.profile.full_name || ""} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(m.profile.full_name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {group.members.map(m => m.profile.full_name?.split(" ").pop() || "").filter(Boolean).join(", ")}
            </p>
          </div>

          {/* Inline rating */}
          {!feedbackSent ? (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-foreground text-center">
                Rate this gathering
              </p>
              <div
                className="flex items-center justify-center gap-2"
                role="radiogroup"
                aria-label="Rate your gathering"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center transition-transform active:scale-[0.9]"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "text-accent fill-accent"
                          : "text-border"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <Button
                onClick={handleSendFeedback}
                disabled={rating === 0 || sending}
                className="w-full h-[44px] rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share feedback"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Thanks for your feedback!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Past Groups Section ────────────────────────────────
function PastGroupsSection({
  groups,
  onViewGroup,
}: {
  groups: PastGroupDisplay[];
  onViewGroup: (group: PastGroupDisplay) => void;
}) {
  if (groups.length === 0) {
    return (
      <Card className="rounded-[20px] border border-border bg-card">
        <CardContent className="py-10 px-6 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
            <Archive className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">No past gatherings yet</p>
          <p className="text-xs text-muted-foreground/70">
            After your first gathering, your history will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groups.slice(0, 3).map((group) => (
        <Card
          key={group.id}
          className="rounded-[18px] border border-border bg-card overflow-hidden"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Date block */}
                <div className="h-11 w-11 rounded-xl bg-muted/50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">{group.day}</span>
                  <span className="text-sm font-bold text-foreground">{group.dateNum}</span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {group.type} · {group.city}
                    </p>
                    <Badge className="bg-muted/60 text-muted-foreground border-none text-[10px] shrink-0">
                      {group.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex -space-x-1.5">
                      {group.members.slice(0, 3).map((m) => (
                        <div
                          key={m.initials}
                          className="h-5 w-5 rounded-full bg-primary/10 border border-card flex items-center justify-center"
                        >
                          <span className="text-[8px] font-semibold text-primary">{m.initials}</span>
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {group.members.length} members
                    </span>
                  </div>
                </div>
              </div>

              {/* View button */}
              <button
                onClick={() => onViewGroup(group)}
                className="shrink-0 h-9 px-3 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-muted/30 transition-colors flex items-center gap-1 min-h-[44px]"
                aria-label={`View ${group.type} group from ${group.date}`}
              >
                View
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Past Group Detail Sheet ────────────────────────────
function PastGroupDetail({
  open,
  onOpenChange,
  group,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: PastGroupDisplay | null;
}) {
  if (!group) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[28px] max-h-[85vh] overflow-y-auto">
        <div className="flex justify-center pt-2 pb-3">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <SheetHeader className="text-left pb-1">
          <SheetTitle className="font-display text-xl font-bold text-foreground">
            {group.type} · {group.date}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {group.city} {group.venue ? `· ${group.venue}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pt-4 pb-6">
          {/* Members */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Group members
            </p>
            <div className="space-y-3">
              {group.members.map((member) => (
                <div key={member.initials} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Venue (if available) */}
          {group.venue && (
            <div className="flex items-center gap-3 p-3 rounded-[14px] bg-muted/40">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Coffee className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{group.venue}</p>
                <p className="text-xs text-muted-foreground">{group.city}</p>
              </div>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Archived chat notice */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Group chat
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-muted/30 border border-border">
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                This chat is archived. You can still view it, but new messages are disabled.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Loading Skeleton ───────────────────────────────────
function LoadingSkeleton() {
  return (
    <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
      <CardContent className="py-12 px-6 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
        <p className="text-sm text-muted-foreground">Loading your gatherings...</p>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function Matches() {
  const navigate = useLocalizedNavigate();

  const [gatheringState, setGatheringState] = useState<GatheringState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("ME");

  // Current week data
  const [currentGroup, setCurrentGroup] = useState<MatchGroup | null>(null);
  const [activeBooking, setActiveBooking] = useState<(Booking & { event?: Event }) | null>(null);
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);

  // Past groups
  const [pastGroups, setPastGroups] = useState<PastGroupDisplay[]>([]);

  // Sheet state
  const [pastGroupDetailOpen, setPastGroupDetailOpen] = useState(false);
  const [selectedPastGroup, setSelectedPastGroup] = useState<PastGroupDisplay | null>(null);

  // ── Fetch all data on mount ───────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setGatheringState("none");
          return;
        }

        setUserId(user.id);

        // Fetch profile, groups, and active booking in parallel
        const [profile, groups, weekendBooking] = await Promise.all([
          getProfile(user.id),
          fetchUserGroups(user.id),
          getActiveBookingForWeekend(user.id),
        ]);

        // Set user initials from profile
        if (profile?.full_name) {
          setUserInitials(getInitials(profile.full_name));
        }

        // Separate current week group from past groups
        const currentWeekGroup = groups.find((g) => isCurrentWeek(g.match_week));
        const pastWeekGroups = groups.filter((g) => !isCurrentWeek(g.match_week));

        // Build past groups display data
        const pastDisplay: PastGroupDisplay[] = pastWeekGroups.map((g) => ({
          id: g.id,
          day: getDayOfWeek(g.match_week),
          date: formatDate(g.match_week),
          dateNum: new Date(g.match_week).getDate().toString(),
          city: g.members[0]?.profile.city || "Berlin",
          type: g.group_type.charAt(0).toUpperCase() + g.group_type.slice(1),
          members: g.members.map((m) => ({
            initials: getInitials(m.profile.full_name),
            name: m.profile.full_name || "Doctor",
            specialty: m.preferences?.specialty || "",
          })),
          venue: "",
          conversationId: g.conversation_id,
          matchWeek: g.match_week,
        }));

        setPastGroups(pastDisplay);

        // Determine gathering state
        if (currentWeekGroup) {
          setCurrentGroup(currentWeekGroup);

          // Check if we should show evaluation (gathering completed)
          const now = new Date();
          const matchDate = new Date(currentWeekGroup.match_week);
          // If the gathering date has passed (after Sunday), show completed state
          const sundayAfter = new Date(matchDate);
          sundayAfter.setDate(sundayAfter.getDate() + 3); // match_week is usually Thursday/Monday

          if (now > sundayAfter) {
            // Check if already evaluated
            const evaluated = await hasSubmittedEvaluation(user.id, currentWeekGroup.id);
            setAlreadyEvaluated(evaluated);
            setGatheringState("completed");
          } else {
            setGatheringState("matched");
          }
        } else if (weekendBooking) {
          // Has booking but no group yet → reserved
          setActiveBooking(weekendBooking);
          setGatheringState("reserved");
        } else {
          setGatheringState("none");
        }
      } catch (error) {
        console.error("Error loading matches data:", error);
        setGatheringState("none");
      }
    }

    loadData();
  }, []);

  // ── Handlers ──────────────────────────────────────────
  const handleGoHome = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  const handleOpenChat = useCallback(() => {
    if (currentGroup?.conversation_id) {
      navigate(`/chat/${currentGroup.conversation_id}`);
    } else {
      navigate("/chat");
    }
  }, [navigate, currentGroup]);

  const handleViewPastGroup = useCallback((group: PastGroupDisplay) => {
    setSelectedPastGroup(group);
    setPastGroupDetailOpen(true);
  }, []);

  // Section title based on state
  const thisWeekTitle = gatheringState === "none" || gatheringState === "loading"
    ? "This week"
    : gatheringState === "reserved" && activeBooking?.event?.date_time
      ? `${getDayOfWeek(activeBooking.event.date_time)} gathering`
      : currentGroup
        ? `${currentGroup.name || "This week's gathering"}`
        : "This week";

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-6 max-w-lg space-y-8">
        {/* ── Page Header ──────────────────────────────── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
            Your gatherings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            This week's gathering and past meetups
          </p>
        </div>

        {/* ── THIS WEEK'S GATHERING ──────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            {thisWeekTitle}
          </h2>

          {/* loading */}
          {gatheringState === "loading" && <LoadingSkeleton />}

          {/* none → empty state */}
          {gatheringState === "none" && (
            <EmptyGatheringState onGoHome={handleGoHome} />
          )}

          {/* reserved → waiting for reveal */}
          {gatheringState === "reserved" && activeBooking && (
            <ReservedGatheringCard
              booking={activeBooking}
              userInitials={userInitials}
            />
          )}

          {/* matched → full group reveal */}
          {gatheringState === "matched" && currentGroup && (
            <MatchedGatheringCard
              group={currentGroup}
              onOpenChat={handleOpenChat}
            />
          )}

          {/* completed → summary + rating */}
          {gatheringState === "completed" && currentGroup && userId && (
            <CompletedGatheringCard
              group={currentGroup}
              userId={userId}
              alreadyEvaluated={alreadyEvaluated}
            />
          )}
        </section>

        {/* ── PAST GATHERINGS ────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-display text-base font-semibold text-muted-foreground">
            Past gatherings
          </h2>
          <PastGroupsSection
            groups={pastGroups}
            onViewGroup={handleViewPastGroup}
          />
        </section>

        <div className="h-4" />
      </main>

      {/* ── Past Group Detail Sheet ────────────────────── */}
      <PastGroupDetail
        open={pastGroupDetailOpen}
        onOpenChange={setPastGroupDetailOpen}
        group={selectedPastGroup}
      />
    </DashboardLayout>
  );
}
