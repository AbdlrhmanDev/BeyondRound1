'use client';

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getEventById,
  getEventByTypeAndCity,
  createBooking,
  updateBookingPayment,
  MEETUP_TYPE_LABELS,
  type Event,
  type MeetupType,
} from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Wallet, UtensilsCrossed, Globe, MapPin, ChevronDown } from "lucide-react";
import { format } from "date-fns";

const STEPS = ["area", "preferences", "confirm", "paywall"] as const;

const BUDGET_OPTIONS = [
  { value: "under15", label: "€ Under €15" },
  { value: "15-30", label: "€€ €15-30" },
  { value: "30+", label: "€€€ €30+" },
];

const DIETARY_OPTIONS = [
  { value: "none", label: "No restrictions" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "GB English" },
  { value: "de", label: "DE German" },
  { value: "both", label: "Both" },
];

const PLANS = [
  { id: "one-time", price: "€9", period: "one-time", subtitle: "Try 1 meetup", desc: "Perfect to see if you like it", features: ["1 meetup included", "Full chat access", "No commitment"], popular: false, bestValue: false },
  { id: "monthly", price: "€19", period: "/month", subtitle: "Monthly", desc: "Unlimited meetups each month", features: ["Unlimited meetups", "Priority matching", "Cancel anytime"], popular: true, bestValue: false },
  { id: "3months", price: "€15", period: "/month", subtitle: "3 Months", desc: "Save 21% vs monthly", originalPrice: "€19", features: ["Unlimited meetups", "Priority matching", "Exclusive events access"], popular: false, bestValue: false },
  { id: "6months", price: "€12", period: "/month", subtitle: "6 Months", desc: "Best value - save 37%", originalPrice: "€19", features: ["Unlimited meetups", "Priority matching", "Exclusive events access", "Founding member badge"], popular: false, bestValue: true },
];

interface NeighborhoodOption {
  value: string;
  label: string;
  score?: number;
}

function getDemoEvent(id: string): Event | null {
  const now = new Date();
  const day = now.getDay();
  const daysToSat = day === 0 ? 6 : 6 - day;
  const sat = new Date(now);
  sat.setDate(sat.getDate() + daysToSat);
  sat.setHours(12, 0, 0, 0);
  const sun = new Date(sat);
  sun.setDate(sun.getDate() + 1);
  
  // Check if id is an event type (brunch, coffee, etc.)
  const validMeetupTypes: MeetupType[] = ["brunch", "coffee", "walk", "sports", "dinner"];
  const isEventType = validMeetupTypes.includes(id as MeetupType);
  
  if (isEventType) {
    // Create a demo event for the given type
    const meetupType = id as MeetupType;
    let dateTime = sat;
    let hour = 12; // Default brunch time
    
    if (meetupType === "coffee") {
      hour = 10; // Morning coffee
      dateTime = sat;
    } else if (meetupType === "brunch") {
      hour = 12; // Brunch
      dateTime = sat;
    } else if (meetupType === "walk") {
      hour = 11; // Morning walk
      dateTime = sun;
    } else if (meetupType === "sports") {
      hour = 14; // Afternoon sports
      dateTime = sun;
    } else if (meetupType === "dinner") {
      hour = 19; // Evening dinner
      dateTime = sat;
    }
    
    dateTime.setHours(hour, 0, 0, 0);
    
    return {
      id: `demo-${meetupType}`,
      city: "Berlin",
      meetup_type: meetupType,
      date_time: dateTime.toISOString(),
      neighborhood: null,
      max_participants: 4,
      min_participants: 3,
      status: "open",
      created_at: "",
      updated_at: "",
    } as Event;
  }
  
  // Handle legacy demo IDs
  const demos: Record<string, Partial<Event>> = {
    "demo-1": { id: "demo-1", city: "Berlin", meetup_type: "brunch", date_time: sat.toISOString(), neighborhood: "mitte", max_participants: 4, min_participants: 3, status: "open", created_at: "", updated_at: "" },
    "demo-2": { id: "demo-2", city: "Berlin", meetup_type: "coffee", date_time: new Date(sat.getTime() + 3 * 60 * 60 * 1000).toISOString(), neighborhood: null, max_participants: 4, min_participants: 3, status: "open", created_at: "", updated_at: "" },
    "demo-3": { id: "demo-3", city: "Berlin", meetup_type: "walk", date_time: new Date(sun.getTime() + 11 * 60 * 60 * 1000).toISOString(), neighborhood: null, max_participants: 4, min_participants: 3, status: "open", created_at: "", updated_at: "" },
    "demo-4": { id: "demo-4", city: "Berlin", meetup_type: "sports", date_time: new Date(sun.getTime() + 14 * 60 * 60 * 1000).toISOString(), neighborhood: null, max_participants: 4, min_participants: 3, status: "open", created_at: "", updated_at: "" },
  };
  const d = demos[id];
  return d ? (d as Event) : null;
}

export default function BookingFlowContent({ eventId }: { eventId: string }) {
  const params = useParams();
  const eid = eventId || (params?.eventId as string);
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const searchParams = useSearchParams();
  const cityFromUrl = searchParams.get("city");
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState("");
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodOption[]>([]);
  const [neighborhoodsLoading, setNeighborhoodsLoading] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [budget, setBudget] = useState("15-30");
  const [dietary, setDietary] = useState("none");
  const [language, setLanguage] = useState("en");

  // Check if it's a demo event or an event type (brunch, coffee, etc.)
  const validMeetupTypes: MeetupType[] = ["brunch", "coffee", "walk", "sports", "dinner"];
  const isEventType = eid && validMeetupTypes.includes(eid as MeetupType);
  const isDemoEvent = eid?.startsWith("demo-") || isEventType;

  const COMMON_CITIES = ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"];

  const fetchNeighborhoods = useCallback(async (city: string) => {
    if (!city) return;
    setNeighborhoodsLoading(true);
    setNeighborhoods([]);
    setNeighborhood("");
    try {
      const res = await fetch(`${typeof window !== "undefined" ? window.location.origin : ""}/api/neighborhoods?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (!data.error) setNeighborhoods(data.neighborhoods || []);
    } catch (err) {
      console.warn("[BookingFlow] Neighborhoods API failed:", err);
    } finally {
      setNeighborhoodsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!eid) return;
    const loadEvent = async () => {
      let found: Event | null = null;
      const city = cityFromUrl || "Berlin";
      if (isEventType && validMeetupTypes.includes(eid as MeetupType)) {
        // Try to find a real event from DB first (so booking gets stored)
        found = await getEventByTypeAndCity(eid as MeetupType, city);
        if (!found) found = getDemoEvent(eid);
      } else if (isDemoEvent) {
        found = getDemoEvent(eid);
      } else {
        found = await getEventById(eid);
      }
      setEvent(found || null);
      const eventCity = found?.city || city;
      setSelectedCity(eventCity);
      if (eventCity) fetchNeighborhoods(eventCity);
    };
    loadEvent().finally(() => setLoading(false));
  }, [eid, isDemoEvent, isEventType, cityFromUrl, fetchNeighborhoods]);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const getBudgetLabel = (v: string) => BUDGET_OPTIONS.find((o) => o.value === v)?.label || v;
  const getDietaryLabel = (v: string) => DIETARY_OPTIONS.find((o) => o.value === v)?.label || v;
  const getLanguageLabel = (v: string) => LANGUAGE_OPTIONS.find((o) => o.value === v)?.label || v;

  const isRealEventId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const handleCreateBooking = async () => {
    if (!user || !event) return;
    setSubmitting(true);
    try {
      let eventId = event.id;
      if (!isRealEventId(event.id)) {
        const neighborhoodValue = neighborhoods.find((n) => n.value === neighborhood)?.label || neighborhood;
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: selectedCity || event.city,
            meetup_type: event.meetup_type,
            date_time: event.date_time,
            neighborhood: neighborhoodValue || neighborhood || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.event?.id) throw new Error(data.error || "Failed to create event");
        eventId = data.event.id;
      }
      const neighborhoodValue = neighborhoods.find((n) => n.value === neighborhood)?.label || neighborhood;
      const b = await createBooking(user.id, eventId, {
        neighborhood: neighborhoodValue || undefined,
        budget: budget ? getBudgetLabel(budget) : undefined,
        dietary: dietary ? getDietaryLabel(dietary) : undefined,
        language: language ? getLanguageLabel(language) : undefined,
      });
      setBookingId(b?.id || null);
      setStep(3);
    } catch (err) {
      toast({
        title: t("booking.error", "Error"),
        description: t("booking.errorCreate", "Could not create booking."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!bookingId) return;
    setSubmitting(true);
    try {
      if (bookingId.startsWith("demo-booking")) {
        setSuccess(true);
        return;
      }
      await updateBookingPayment(bookingId, `mock_${selectedPlan}_${Date.now()}`, true);
      setSuccess(true);
    } catch (err) {
      toast({
        title: t("booking.error", "Error"),
        description: t("booking.errorCreate", "Could not complete payment."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!neighborhood?.trim();
    if (step === 1) return true;
    if (step === 2) return true;
    return false;
  };

  const handleNext = () => {
    if (step === 2) {
      handleCreateBooking();
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (loading || !event) {
    return (
      <DashboardLayout>
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-64 rounded-2xl" />
        </main>
      </DashboardLayout>
    );
  }

  const currentStep = STEPS[step];
  const eventLabel = MEETUP_TYPE_LABELS[event.meetup_type as keyof typeof MEETUP_TYPE_LABELS] || event.meetup_type;
  const dateStr = format(new Date(event.date_time), "EEEE, MMM d");
  const timeStr = format(new Date(event.date_time), "HH:mm");
  const successDateStr = format(new Date(event.date_time), "EEEE, MMM d 'at' HH:mm");

  if (success) {
    return (
      <DashboardLayout>
        <main className="container mx-auto px-4 py-8 max-w-lg text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            {t("booking.youreBooked", "You're booked!")}
          </h1>
          <p className="text-foreground mb-8">
            {event.city} {eventLabel} — {successDateStr}
          </p>
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4 text-left mb-8">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-primary text-sm">🕐</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{t("booking.matchingOnThursday", "Matching on Thursday")}</p>
                <p className="text-sm text-muted-foreground">{t("booking.matchingDesc", "You'll be matched with 2-3 other doctors at 16:00")}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-primary text-sm">💬</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{t("booking.chatOpensAfter", "Chat opens after matching")}</p>
                <p className="text-sm text-muted-foreground">{t("booking.chatOpensDesc", "Meet your group and plan your meetup together")}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-primary text-sm">📅</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{t("booking.weRemindYou", "We'll remind you")}</p>
                <p className="text-sm text-muted-foreground">{t("booking.remindDesc", "Email reminders on Thursday and Friday")}</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {t("common.backToHome", "Back to home")}
          </Button>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-4 sm:py-6 max-w-lg min-h-0">
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>

        <p className="font-display font-semibold text-foreground mb-0.5">{eventLabel}</p>
        <p className="text-sm text-muted-foreground mb-6">{dateStr} · {timeStr}</p>

        {/* Step indicator - numbered circles with checkmarks for completed */}
        {currentStep !== "paywall" && (
          <div className="flex items-center gap-0 mb-6 sm:mb-8">
            {STEPS.slice(0, 4).map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
                </div>
                {i < 3 && (
                  <div className={`h-0.5 flex-1 mx-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Area */}
        {currentStep === "area" && (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {t("booking.whereToMeet", "Where would you like to meet?")}
              </h2>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCityPicker(!showCityPicker)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedCity || event?.city}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCityPicker ? "rotate-180" : ""}`} />
                </button>
                {showCityPicker && (
                  <div className="absolute top-full left-0 mt-1 py-2 rounded-xl bg-card border border-border shadow-lg z-10 min-w-[180px] max-h-[300px] overflow-y-auto">
                    {/* Show current city if not in common list */}
                    {selectedCity && !COMMON_CITIES.includes(selectedCity) && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCityPicker(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm font-medium bg-primary/10 text-primary hover:bg-primary/15"
                        >
                          {selectedCity} (current)
                        </button>
                        <div className="h-px bg-border my-1" />
                      </>
                    )}
                    {COMMON_CITIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSelectedCity(c);
                          setShowCityPicker(false);
                          fetchNeighborhoods(c);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-muted/50 ${
                          selectedCity === c ? "bg-primary/10 text-primary font-medium" : ""
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t("booking.selectNeighborhoodIn", "Select your preferred neighborhood in {{city}}", { city: selectedCity || event?.city })}
            </p>
            {neighborhoods.length > 0 ? (
              <RadioGroup
                value={neighborhood}
                onValueChange={setNeighborhood}
                className="space-y-3"
              >
                {neighborhoods.map((n, idx) => (
                  <label
                    key={n.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all bg-card ${
                      neighborhood === n.value
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-primary/30"
                    }`}
                  >
                    <RadioGroupItem value={n.value} id={n.value} className="shrink-0" />
                    <span className="min-w-0 flex-1 font-medium text-foreground">{n.label}</span>
                    {idx < 2 && (n.score || 0) > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                        {t("booking.popular", "Popular")}
                      </span>
                    )}
                  </label>
                ))}
              </RadioGroup>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">{t("booking.neighborhood", "Neighborhood")}</Label>
                  <Input
                    id="neighborhood"
                    placeholder={t("booking.neighborhoodPlaceholderGeneric", "Enter neighborhood or area name")}
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("booking.neighborhoodFallback", "Enter your preferred area in {{city}}", { city: selectedCity || event?.city || "" })}
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Step 2: Preferences */}
        {currentStep === "preferences" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-1">
              {t("booking.preferences", "Your preferences")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("booking.preferencesHintHelp", "Help us find the perfect match for you")}
            </p>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t("booking.budget", "Budget")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setBudget(o.value)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        budget === o.value
                          ? "bg-primary/15 border border-primary text-foreground"
                          : "bg-muted/60 border border-transparent text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t("booking.dietaryRestrictions", "Dietary restrictions")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setDietary(o.value)}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                        dietary === o.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t("booking.languagePreference", "Language preference")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setLanguage(o.value)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        language === o.value
                          ? "bg-primary/15 border border-primary text-foreground"
                          : "bg-muted/60 border border-transparent text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {o.value === "both" && <Globe className="h-3.5 w-3.5" />}
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {currentStep === "confirm" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-1">
              {t("booking.confirm", "Confirm your booking")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("booking.confirmHint", "Review your details before proceeding to payment")}
            </p>
            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.event", "Event")}</span>
                <span className="font-medium">{eventLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.dateTime", "Date & Time")}</span>
                <span className="font-medium">{dateStr} · {timeStr}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.area", "Area")}</span>
                <span className="font-medium">{neighborhoods.find((n) => n.value === neighborhood)?.label || neighborhood}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.budget", "Budget")}</span>
                <span className="font-medium">{getBudgetLabel(budget)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.dietaryShort", "Dietary")}</span>
                <span className="font-medium">{getDietaryLabel(dietary)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("booking.language", "Language")}</span>
                <span className="font-medium">{getLanguageLabel(language)}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center space-y-1">
              <p className="text-sm font-medium">{t("booking.matchingThursday", "Matching happens Thursday 16:00")}</p>
              <p className="text-sm text-muted-foreground">{t("booking.matchingChatHint", "You'll receive your group and chat access after matching")}</p>
            </div>
          </div>
        )}

        {/* Step 4: Paywall */}
        {currentStep === "paywall" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-1">
              {t("booking.paywallJoinTitle", "Join the community")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("booking.paywallSubtitle", "Meet verified doctors every weekend.")}
            </p>
            <div className="space-y-3 mb-6">
              {PLANS.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all relative ${
                    selectedPlan === p.id
                      ? p.bestValue
                        ? "border-emerald-500/60 bg-amber-50/50 dark:bg-amber-950/20"
                        : "border-primary bg-primary/5"
                      : "border-border/60 bg-card hover:border-primary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.id}
                    checked={selectedPlan === p.id}
                    onChange={() => setSelectedPlan(p.id)}
                    className="sr-only"
                  />
                  <div className="flex h-5 w-5 shrink-0 rounded-full border-2 mt-0.5 flex items-center justify-center">
                    {selectedPlan === p.id && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.popular && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                          {t("booking.popular", "Popular")}
                        </span>
                      )}
                      {p.bestValue && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-600 text-white flex items-center gap-1">
                          <span>★</span> {t("booking.bestValue", "Best Value")}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold mt-1">
                      <span className="text-foreground">{p.price}</span>
                      {p.period && <span className="text-muted-foreground font-normal">{p.period}</span>}
                      {p.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through ml-1">{p.originalPrice}</span>
                      )}
                    </p>
                    <p className="text-sm font-medium text-foreground">{p.subtitle}</p>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                    <ul className="mt-2 space-y-1">
                      {p.features.map((f, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mb-4">
              {t("booking.securePayment", "Secure payment powered by Stripe")}
            </p>
            <p className="text-xs text-muted-foreground text-center mb-6">
              {t("booking.cancelAnytime", "Cancel anytime from your profile")}
            </p>
            <Button
              onClick={handleCompletePayment}
              disabled={submitting}
              className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {submitting ? t("common.loading") : t("booking.continueWithPlan", "Continue with {{plan}}", { plan: PLANS.find((x) => x.id === selectedPlan)?.subtitle || "Plan" })}
            </Button>
            <Button variant="ghost" onClick={handleBack} className="w-full rounded-xl mt-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
          </div>
        )}

        {/* Navigation */}
        {currentStep !== "paywall" && (
          <div className="mt-8 flex flex-col gap-3">
            <Button
              onClick={handleNext}
              disabled={!canProceed() || submitting}
              className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {step === 2 ? (
                submitting ? t("common.loading") : t("booking.continueToPayment", "Continue to payment")
              ) : (
                t("common.continue", "Continue")
              )}
            </Button>
            {step > 0 && (
              <Button variant="ghost" onClick={handleBack} className="w-full rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("common.back")}
              </Button>
            )}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
