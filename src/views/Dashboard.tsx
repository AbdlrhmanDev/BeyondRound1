'use client';

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, getPublicProfile } from "@/services/profileService";
import { getUserGroupMemberships, getGroupMembers } from "@/services/matchService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  MessageCircle,
  Star,
  Clock,
  CreditCard,
  Shield,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────
export type GatheringState = "none" | "reserved" | "matched" | "completed";

type PaymentMethod = "card" | "apple_pay" | "paypal";

export interface DayOption {
  id: string;
  label: string;
  date: string;
  timeHint: string;
  spotsLeft: number;
}

interface UserProfile {
  full_name: string;
  initials: string;
  avatar_url: string | null;
  city: string;
}

interface GroupMemberInfo {
  id: string;
  name: string;
  initials: string;
  avatar_url: string | null;
  specialty: string;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

// ─── localStorage helpers ───────────────────────────────
const GATHERING_STATE_KEY = "gathering_state";
const GATHERING_DAY_KEY = "gathering_day";

function readGatheringState(): GatheringState {
  if (typeof window === "undefined") return "none";
  return (localStorage.getItem(GATHERING_STATE_KEY) as GatheringState) || "none";
}

function readGatheringDay(): DayOption | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(GATHERING_DAY_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function writeGatheringState(state: GatheringState, day: DayOption | null) {
  localStorage.setItem(GATHERING_STATE_KEY, state);
  if (day) {
    localStorage.setItem(GATHERING_DAY_KEY, JSON.stringify(day));
  } else {
    localStorage.removeItem(GATHERING_DAY_KEY);
  }
}

// ─── Weekend Day Options (dynamic dates) ────────────────
function getWeekendDays(): DayOption[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri, 6=Sat

  // Find next Friday
  const daysToFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);

  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);

  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return [
    { id: "friday",   label: "Friday gathering",   date: formatDate(friday),   timeHint: "Evening · 7 PM",  spotsLeft: 4  },
    { id: "saturday", label: "Saturday gathering",  date: formatDate(saturday), timeHint: "Morning · 11 AM", spotsLeft: 6  },
    { id: "sunday",   label: "Sunday gathering",    date: formatDate(sunday),   timeHint: "Morning · 11 AM", spotsLeft: 8  },
  ];
}

// ─── Choose Day Module ──────────────────────────────────
function ChooseDayModule({
  onSelectDay,
  city,
}: {
  onSelectDay: (day: DayOption) => void;
  city: string;
}) {
  const weekendDays = getWeekendDays();

  return (
    <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-primary/80 via-accent to-[hsl(15,60%,82%)]" />
      <CardContent className="p-5 space-y-5">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground tracking-tight">
            Join this weekend's gathering
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Pick the day that works best. We'll place you in a small group of verified
            doctors in {city}.
          </p>
        </div>

        <div className="space-y-3">
          {weekendDays.map((day) => {
            const isFilled = day.spotsLeft === 0;
            return (
              <button
                key={day.id}
                onClick={() => !isFilled && onSelectDay(day)}
                disabled={isFilled}
                className={`w-full rounded-[18px] border p-5 text-left transition-all active:scale-[0.98] ${
                  isFilled
                    ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                    : "border-border bg-card hover:border-accent/40 hover:shadow-md"
                }`}
                aria-label={
                  isFilled
                    ? `${day.label}, ${day.date}, filled`
                    : `Choose ${day.label}, ${day.date}, ${day.timeHint}, ${day.spotsLeft} spots remaining`
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-display text-[17px] font-semibold text-foreground">
                      {day.label}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{day.date}</p>
                  </div>
                  {isFilled ? (
                    <Badge className="bg-muted text-muted-foreground border-border text-[11px]">
                      Filled
                    </Badge>
                  ) : day.spotsLeft <= 4 ? (
                    <Badge className="bg-accent/10 text-accent border-none text-[11px] font-semibold">
                      {day.spotsLeft === 1 ? "Last spot" : `${day.spotsLeft} spots left`}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 text-[13px] text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {day.timeHint}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    3–4 doctors
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {city}
                  </span>
                </div>

                {!isFilled && (
                  <div className="w-full h-[48px] rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-sm flex items-center justify-center transition-colors">
                    Choose {day.label.split(" ")[0]}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Limited weekend capacity — 24 spots total.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Payment Sheet ──────────────────────────────────────
function PaymentSheet({
  open,
  onOpenChange,
  selectedDay,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDay: DayOption | null;
  onSuccess: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("apple_pay");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = useCallback(() => {
    if (method === "card" && (!cardNumber || !cardExpiry || !cardCvc)) {
      setError("Please fill in all card details.");
      return;
    }

    setError(null);
    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
      onSuccess();
    }, 2500);
  }, [method, cardNumber, cardExpiry, cardCvc, onSuccess]);

  const handleClose = useCallback(
    (value: boolean) => {
      if (processing) return;
      if (!value) {
        setError(null);
        setCardNumber("");
        setCardExpiry("");
        setCardCvc("");
      }
      onOpenChange(value);
    },
    [processing, onOpenChange]
  );

  if (!selectedDay) return null;

  const paymentMethods: { id: PaymentMethod; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: "apple_pay",
      label: "Apple Pay",
      sub: "Fastest checkout",
      icon: <div className="h-5 w-5 rounded bg-foreground text-background flex items-center justify-center text-[10px] font-bold"></div>,
    },
    {
      id: "card",
      label: "Credit or debit card",
      sub: "Visa, Mastercard, Amex",
      icon: <CreditCard className="h-5 w-5 text-muted-foreground" />,
    },
    {
      id: "paypal",
      label: "PayPal",
      sub: "Pay with your account",
      icon: <div className="h-5 w-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">P</div>,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-[28px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-2 pb-3">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <SheetHeader className="text-left pb-1">
          <SheetTitle className="font-display text-xl font-bold text-foreground">
            Complete your reservation
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {selectedDay.label.split(" ")[0]}, {selectedDay.date} · {selectedDay.timeHint.split(" · ")[1] || selectedDay.timeHint}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pt-4 pb-2">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your weekend gathering includes
            </p>
            <ul className="space-y-2">
              {[
                "Curated group of 3–4 doctors",
                "Verified, like-minded professionals",
                "Café or brunch venue in your area",
                "Group chat opens Thursday",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payment method
            </p>
            <div className="space-y-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => { setMethod(pm.id); setError(null); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-[14px] border transition-all min-h-[56px] text-left active:scale-[0.99] ${
                    method === pm.id
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-border/80"
                  }`}
                  aria-pressed={method === pm.id}
                >
                  <div className="shrink-0">{pm.icon}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${method === pm.id ? "text-accent" : "text-foreground"}`}>
                      {pm.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{pm.sub}</p>
                  </div>
                  {method === pm.id && (
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {method === "card" && (
            <div className="space-y-3">
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                className="h-12 rounded-[12px]"
                aria-label="Card number"
                inputMode="numeric"
                maxLength={19}
              />
              <div className="flex gap-3">
                <Input
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="h-12 rounded-[12px] flex-1"
                  aria-label="Expiry date"
                  inputMode="numeric"
                  maxLength={5}
                />
                <Input
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  placeholder="CVC"
                  className="h-12 rounded-[12px] flex-1"
                  aria-label="Security code"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>
            </div>
          )}

          {error && (
            <div
              className="flex items-start gap-2.5 p-3 rounded-[12px] bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900"
              role="alert"
              aria-live="assertive"
            >
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-red-600 font-medium underline mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <Button
            onClick={handlePay}
            disabled={processing}
            className="w-full h-[56px] rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-base active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Reserving...
              </span>
            ) : (
              "Reserve my spot"
            )}
          </Button>

          <div className="text-center space-y-1.5">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Secure checkout · Doctors-only community
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
              You can cancel up to 48 hours before your gathering. No-shows may affect future
              access.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Reserved Card ──────────────────────────────────────
function ReservedCard({
  selectedDay,
  onCancel,
  userInitials,
  city,
}: {
  selectedDay: DayOption;
  onCancel: () => void;
  userInitials: string;
  city: string;
}) {
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = useCallback(() => {
    setCancelling(true);
    setTimeout(() => {
      setCancelling(false);
      setShowCancel(false);
      onCancel();
    }, 1200);
  }, [onCancel]);

  return (
    <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-primary/80 via-accent to-[hsl(15,60%,82%)]" />
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                You're in!
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedDay.label.split(" ")[0]}, {selectedDay.date} · {city}
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
            Confirmed
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

        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          Your group of 3–4 doctors will be revealed on <strong className="text-foreground">Thursday</strong>.
        </p>

        {/* Countdown hint */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Group reveal: Thursday evening
        </div>

        {/* Cancel / change day section */}
        {!showCancel ? (
          <button
            onClick={() => setShowCancel(true)}
            className="text-xs text-accent font-medium underline underline-offset-2 w-full text-center min-h-[44px] flex items-center justify-center"
          >
            Change day
          </button>
        ) : (
          <div className="space-y-3 p-4 rounded-[14px] bg-muted/30 border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              You can cancel and choose a different day. Your spot will be released for
              someone else.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancel(false)}
                className="flex-1 h-11 rounded-full text-sm font-semibold"
              >
                Keep my spot
              </Button>
              <Button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold active:scale-[0.98] transition-all"
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel reservation"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Matched Preview Card (compact — full view on /matches) ─
function MatchedPreviewCard({
  selectedDay,
  onViewGathering,
  groupMembers,
  city,
}: {
  selectedDay: DayOption;
  onViewGathering: () => void;
  groupMembers: GroupMemberInfo[];
  city: string;
}) {
  return (
    <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-primary/80 via-accent to-[hsl(15,60%,82%)]" />
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                Your group is ready
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedDay.label.split(" ")[0]}, {selectedDay.date} · {city}
            </p>
          </div>
          <Badge className="bg-accent/10 text-accent border-none text-xs font-semibold">
            Matched
          </Badge>
        </div>

        {/* Compact member preview */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {groupMembers.map((m) => (
              <Avatar key={m.id} className="h-10 w-10 border-[2px] border-card">
                <AvatarImage src={m.avatar_url || undefined} alt={m.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {m.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {groupMembers.length} doctors in your group
          </p>
        </div>

        <Button
          onClick={onViewGathering}
          className="w-full h-[52px] rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-base shadow-sm active:scale-[0.98] transition-all"
        >
          See your gathering
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Completed Card ─────────────────────────────────────
function CompletedCard({
  onChooseNext,
}: {
  onChooseNext: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendFeedback = useCallback(() => {
    if (rating === 0) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setFeedbackSent(true);
    }, 1000);
  }, [rating]);

  return (
    <Card className="rounded-[24px] bg-card border border-border shadow-card overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-primary/80 via-accent to-[hsl(15,60%,82%)]" />
      <CardContent className="p-5 space-y-5">
        {!feedbackSent ? (
          <>
            <h2 className="font-display text-lg font-semibold text-foreground text-center">
              How was your gathering?
            </h2>

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
                    className={`h-8 w-8 transition-colors ${
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
              className="w-full h-[48px] rounded-full bg-accent hover:bg-accent/90 text-white font-display font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Share feedback"}
            </Button>
          </>
        ) : (
          <div className="text-center space-y-2 py-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Thanks for your feedback!</p>
          </div>
        )}

        <div className="h-px bg-border" />

        <div className="text-center space-y-3">
          <p className="text-sm text-foreground font-medium">Ready for next weekend?</p>
          <p className="text-xs text-muted-foreground">Same format, new group.</p>
          <Button
            onClick={onChooseNext}
            className="w-full h-[48px] rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-semibold text-sm active:scale-[0.98] transition-all"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Join next weekend
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── How It Works ───────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: Calendar, title: "Choose a day", desc: "Pick Friday, Saturday, or Sunday" },
    { icon: Users, title: "Get matched", desc: "We group you with 3–4 like-minded doctors" },
    { icon: MessageCircle, title: "Meet up", desc: "Chat beforehand, then meet at a curated venue" },
  ];

  return (
    <Card className="rounded-[20px] border border-border bg-card">
      <CardContent className="p-5 space-y-4">
        <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          How it works
        </h3>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <step.icon className="h-4.5 w-4.5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ─────────────────────────────────────
export default function Dashboard() {
  const navigate = useLocalizedNavigate();
  const { user, loading: authLoading } = useAuth();

  const [state, setState] = useState<GatheringState>("none");
  const [selectedDay, setSelectedDay] = useState<DayOption | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Load profile data from Supabase
  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) { setLoading(false); return; }

    let cancelled = false;

    const loadProfile = async () => {
      const profile = await getProfile(user.id);
      if (cancelled) return;

      if (profile) {
        setUserProfile({
          full_name: profile.full_name || "",
          initials: getInitials(profile.full_name),
          avatar_url: profile.avatar_url || null,
          city: profile.city || "Berlin",
        });
      }
      setLoading(false);
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  // Load group members when in matched state
  useEffect(() => {
    if (state !== "matched" || !user?.id) return;

    let cancelled = false;

    const loadGroupMembers = async () => {
      const memberships = await getUserGroupMemberships(user.id);
      if (cancelled || !memberships || memberships.length === 0) return;

      // Get the most recent group
      const latestMembership = memberships[memberships.length - 1] as { group_id: string };
      if (!latestMembership?.group_id) return;

      const members = await getGroupMembers(latestMembership.group_id);
      if (cancelled || !members || members.length === 0) return;

      // Fetch profiles for each member (excluding self)
      const otherMembers = (members as { user_id: string }[])
        .filter((m) => m.user_id !== user.id);

      const profilePromises = otherMembers.map(async (m) => {
        const profile = await getPublicProfile(m.user_id);
        const name = profile?.full_name || "Doctor";
        return {
          id: m.user_id,
          name,
          initials: getInitials(name),
          avatar_url: profile?.avatar_url || null,
          specialty: "",
        } satisfies GroupMemberInfo;
      });

      const memberInfos = await Promise.all(profilePromises);
      if (!cancelled) setGroupMembers(memberInfos);
    };

    loadGroupMembers();
    return () => { cancelled = true; };
  }, [state, user?.id]);

  // Read persisted state on mount
  useEffect(() => {
    setState(readGatheringState());
    setSelectedDay(readGatheringDay());
  }, []);

  // Persist state changes to localStorage
  const updateState = useCallback((newState: GatheringState, day: DayOption | null) => {
    setState(newState);
    setSelectedDay(day);
    writeGatheringState(newState, day);
  }, []);

  // ── Greeting ──────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = userProfile?.full_name
    ? userProfile.full_name.split(" ")[0]
    : "there";
  const city = userProfile?.city || "Berlin";

  const sublines: Record<GatheringState, string> = {
    none: "Your weekend starts here.",
    reserved: selectedDay
      ? `You're all set for ${selectedDay.label.split(" ")[0]}. Sit tight.`
      : "",
    matched: "Your group is ready. Say hello.",
    completed: "Hope it was a good one.",
  };

  // ── Handlers ──────────────────────────────────────────
  const handleSelectDay = useCallback((day: DayOption) => {
    setSelectedDay(day);
    setPaymentOpen(true);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setPaymentOpen(false);
    if (selectedDay) {
      updateState("reserved", selectedDay);
    }
  }, [selectedDay, updateState]);

  const handleCancelReservation = useCallback(() => {
    updateState("none", null);
  }, [updateState]);

  const handleSimulateMatch = useCallback(() => {
    updateState("matched", selectedDay);
  }, [selectedDay, updateState]);

  const handleSimulateComplete = useCallback(() => {
    updateState("completed", selectedDay);
  }, [selectedDay, updateState]);

  const handleChooseNext = useCallback(() => {
    updateState("none", null);
  }, [updateState]);

  const handleViewGathering = useCallback(() => {
    navigate("/matches");
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-[24px]" />
          <Skeleton className="h-32 w-full rounded-[20px]" />
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* ── Greeting ────────────────────────────────── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{sublines[state]}</p>
        </div>

        {/* ── State: none → Choose Day ───────────────── */}
        {state === "none" && (
          <>
            <ChooseDayModule onSelectDay={handleSelectDay} city={city} />
            <HowItWorks />
          </>
        )}

        {/* ── State: reserved → Waiting for Thursday ─── */}
        {state === "reserved" && selectedDay && (
          <>
            <ReservedCard
              selectedDay={selectedDay}
              onCancel={handleCancelReservation}
              userInitials={userProfile?.initials || "?"}
              city={city}
            />
            {/* Dev helper */}
            <button
              onClick={handleSimulateMatch}
              className="w-full text-xs text-muted-foreground/50 text-center py-2 min-h-[44px]"
            >
              ↓ Simulate Thursday match reveal ↓
            </button>
          </>
        )}

        {/* ── State: matched → Compact preview ───────── */}
        {state === "matched" && selectedDay && (
          <>
            <MatchedPreviewCard
              selectedDay={selectedDay}
              onViewGathering={handleViewGathering}
              groupMembers={groupMembers}
              city={city}
            />
            {/* Dev helper */}
            <button
              onClick={handleSimulateComplete}
              className="w-full text-xs text-muted-foreground/50 text-center py-2 min-h-[44px]"
            >
              ↓ Simulate gathering completed ↓
            </button>
          </>
        )}

        {/* ── State: completed → Rating + next ───────── */}
        {state === "completed" && (
          <CompletedCard onChooseNext={handleChooseNext} />
        )}

        <div className="h-4" />
      </main>

      {/* ── Payment Sheet ──────────────────────────────── */}
      <PaymentSheet
        open={paymentOpen}
        onOpenChange={(open) => {
          setPaymentOpen(open);
          if (!open && state === "none") {
            setSelectedDay(null);
          }
        }}
        selectedDay={selectedDay}
        onSuccess={handlePaymentSuccess}
      />
    </DashboardLayout>
  );
}
