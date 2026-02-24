'use client';

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { joinWaitlist, getWaitlistCount } from "@/services/waitlistService";
import { useAuth } from "@/hooks/useAuth";
import LocalizedLink from "@/components/LocalizedLink";
import {
  Shield, Users, Calendar, MessageCircle, MapPin,
  Check, ChevronDown, ArrowRight, Star, Lock, Heart
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT_CLASS = [
  'w-full rounded-[16px] border border-[#E8DED5] bg-white/80 px-4 py-3',
  'text-sm text-[#1A0A12] placeholder:text-[#5E555B]/50',
  'transition-all duration-200 h-12',
  'focus:outline-none focus:border-[#F27C5C] focus:ring-[3px] focus:ring-[#F27C5C]/20',
  'hover:border-[#D4C9C1]',
].join(' ');

const SPECIALTIES = [
  "Cardiology", "Dermatology", "Emergency Medicine", "Family Medicine",
  "Internal Medicine", "Neurology", "Oncology", "Pediatrics",
  "Psychiatry", "Radiology", "Surgery", "Other",
];

const ROLES = ["Resident", "Attending", "Specialist", "Final-year med student"];

const INTERESTS = [
  "Coffee", "Hiking", "Running", "Food", "Art", "Music",
  "Travel", "Cinema", "Books", "Yoga", "Cycling",
];

const BERLIN_AREAS = [
  "Mitte", "Prenzlauer Berg", "Neukölln", "Friedrichshain",
  "Kreuzberg", "Charlottenburg", "Schöneberg", "Steglitz", "Other",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[#5E555B]">
      <span className="text-[#F27C5C]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white/70 border border-[#E8DED5] rounded-[22px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="h-11 w-11 rounded-xl bg-[#F27C5C]/10 flex items-center justify-center mb-4 text-[#F27C5C]">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-[#1A0A12] mb-2">{title}</h3>
      <p className="text-sm text-[#5E555B] leading-relaxed">{desc}</p>
    </div>
  );
}

function StepBubble({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start bg-white/60 border border-[#E8DED5] rounded-[18px] p-5 shadow-[0_1px_4px_rgba(58,11,34,0.03)]">
      <div className="h-9 w-9 rounded-full bg-[#F27C5C] text-white font-bold text-sm flex items-center justify-center shrink-0">
        {n}
      </div>
      <div>
        <h3 className="font-semibold text-[#1A0A12] mb-1">{title}</h3>
        <p className="text-sm text-[#5E555B] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="bg-white/70 border border-[#E8DED5] rounded-[22px] p-6 shadow-sm flex flex-col gap-4">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-[#F27C5C] text-[#F27C5C]" />
        ))}
      </div>
      <p className="text-[#5E555B] text-sm leading-relaxed italic">"{quote}"</p>
      <div>
        <p className="font-semibold text-[#1A0A12] text-sm">{name}</p>
        <p className="text-xs text-[#5E555B]/70">{role} · <span className="italic">Example</span></p>
      </div>
    </div>
  );
}

function PriceCard({
  tag, price, period, billed, features, cta, accent, badge,
}: {
  tag: string; price: string; period: string; billed?: string; features: string[];
  cta: string; accent?: boolean; badge?: string;
}) {
  return (
    <div
      className={[
        "rounded-[22px] p-6 flex flex-col gap-4 border relative",
        accent
          ? "bg-[#F27C5C] border-[#F27C5C] text-white shadow-lg shadow-[#F27C5C]/25"
          : "bg-white/60 border-[#E8DED5] text-[#1A0A12]",
      ].join(' ')}
    >
      {badge && (
        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 inline-flex w-fit items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
          accent ? 'bg-white text-[#F27C5C]' : 'bg-[#3A0B22] text-white'
        }`}>
          {badge}
        </span>
      )}
      <p className={`text-xs font-semibold tracking-widest uppercase ${accent ? 'text-white/70' : 'text-[#F27C5C]'}`}>
        {tag}
      </p>
      <div>
        <span className={`font-display text-4xl font-bold ${accent ? 'text-white' : 'text-[#1A0A12]'}`}>
          {price}
        </span>
        <span className={`text-sm ml-1 ${accent ? 'text-white/70' : 'text-[#5E555B]'}`}>{period}</span>
        {billed && <p className={`text-xs mt-0.5 ${accent ? 'text-white/60' : 'text-[#5E555B]/60'}`}>{billed}</p>}
      </div>
      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className={`h-4 w-4 mt-0.5 shrink-0 ${accent ? 'text-white' : 'text-[#F27C5C]'}`} />
            <span className={accent ? 'text-white/90' : 'text-[#5E555B]'}>{f}</span>
          </li>
        ))}
      </ul>
      <a
        href="#waitlist-form"
        className={[
          "inline-flex items-center justify-center h-11 rounded-full font-semibold text-sm transition-all active:scale-[0.98]",
          accent
            ? "bg-white text-[#F27C5C] hover:bg-white/90"
            : "bg-[#3A0B22] text-white hover:bg-[#4B0F2D]",
        ].join(' ')}
      >
        {cta}
      </a>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/60 border border-[#E8DED5] rounded-[18px] overflow-hidden shadow-[0_1px_4px_rgba(58,11,34,0.03)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left min-h-[52px]"
      >
        <span className="font-semibold text-[#1A0A12] text-[15px] leading-snug">{q}</span>
        <ChevronDown
          className={`h-5 w-5 text-[#5E555B] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-[#5E555B] text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const Waitlist = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [area, setArea] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Animated counter
  const [waitlistCount, setWaitlistCount] = useState(500);
  const [animatedCount, setAnimatedCount] = useState(0);
  const countRef = useRef(waitlistCount);
  useEffect(() => { countRef.current = waitlistCount; }, [waitlistCount]);

  const animateCounter = (target: number, start = 0) => {
    const steps = 60;
    const duration = 1500;
    const inc = (target - start) / steps;
    let cur = start;
    const timer = setInterval(() => {
      cur += inc;
      const done = inc > 0 ? cur >= target : cur <= target;
      if (done) { setAnimatedCount(target); clearInterval(timer); }
      else setAnimatedCount(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(timer);
  };

  useEffect(() => {
    getWaitlistCount().then((c) => { setWaitlistCount(c); animateCounter(c, 0); });
    const iv = setInterval(async () => {
      const c = await getWaitlistCount().catch(() => countRef.current);
      if (c !== countRef.current) { setWaitlistCount(c); animateCounter(c, countRef.current); }
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const toggleInterest = (i: string) =>
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    if (!consent) {
      toast({ title: "Consent required", description: "Please accept how we handle your data.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await joinWaitlist({
        email,
        city: area || undefined,
        medicalSpecialty: specialty || undefined,
      });
      if (result.success) {
        setSubmitted(true);
        setEmail(""); setFirstName(""); setRole(""); setSpecialty(""); setInterests([]); setArea(""); setConsent(false);
        try {
          await fetch('/api/notifications/whitelist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
        } catch { /* non-critical */ }
        toast({ title: "You're on the list!", description: "We'll be in touch soon." });
      } else {
        toast({ title: "Something went wrong", description: result.error ?? "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F6F1EC]">

      {/* ── 1. HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30">
        <div className="mx-3 mt-3 sm:mx-4 sm:mt-4">
          <div className="bg-[#3A0B22]/90 backdrop-blur-xl border border-white/[0.06] rounded-[20px] shadow-lg shadow-[#3A0B22]/15">
            <div className="container mx-auto px-5 sm:px-6">
              <div className="flex items-center h-14 sm:h-[60px]">
                {/* Logo */}
                <LocalizedLink to="#" className="flex items-center gap-0.5 mr-auto">
                  <span className="font-display font-bold text-xl text-white italic tracking-tight">Beyond</span>
                  <span className="font-display font-bold text-xl text-[#F6B4A8] italic tracking-tight">Rounds</span>
                </LocalizedLink>

                {/* Nav anchors — hidden on mobile */}
                <nav className="hidden md:flex items-center gap-6 text-sm text-white/70 mx-auto">
                  <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
                  <a href="#pricing" className="hover:text-white transition-colors">Early access</a>
                  <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                </nav>

                {/* CTA */}
                <div className="ml-auto">
                  {!authLoading && user ? (
                    <LocalizedLink
                      to="/dashboard"
                      className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] transition-all shadow-sm"
                    >
                      Dashboard
                    </LocalizedLink>
                  ) : (
                    <a
                      href="#waitlist-form"
                      className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] transition-all shadow-sm"
                    >
                      Join free
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>

        {/* ── 2. HERO ───────────────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent pointer-events-none" />
          <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">
              Berlin · Doctor-only community
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A0A12] tracking-tight leading-[1.1] mb-5">
              Meet other doctors{" "}
              <span className="text-[#F27C5C]">in Berlin.</span>
            </h1>
            <p className="text-lg text-[#5E555B] max-w-xl mx-auto leading-relaxed mb-10">
              Every week, we match you with 3–4 verified doctors who share your interests — and open a private chat to plan where you'll meet.
            </p>

            {/* Trust bullets */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
              <TrustBadge icon={<Shield className="h-4 w-4" />} text="Verified within 24 hours" />
              <TrustBadge icon={<Users className="h-4 w-4" />} text="Doctors only" />
              <TrustBadge icon={<Calendar className="h-4 w-4" />} text="One match every Friday" />
            </div>

            {/* Counter pill */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 border border-[#E8DED5]/60 shadow-sm mb-10">
              <span className="font-display text-2xl font-bold text-[#3A0B22]">{animatedCount.toLocaleString()}+</span>
              <span className="text-sm text-[#5E555B]">doctors already joined</span>
            </div>

            {/* Primary CTA → scrolls to form */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#waitlist-form"
                className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-[#F27C5C] hover:bg-[#e06d4d] text-white font-display font-semibold text-base transition-all active:scale-[0.98] shadow-md shadow-[#F27C5C]/25"
              >
                Claim your free spot <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center h-14 px-8 rounded-full border border-[#3A0B22]/20 text-[#3A0B22] font-semibold text-base hover:border-[#3A0B22]/40 hover:bg-[#3A0B22]/[0.03] transition-all"
              >
                See how it works ↓
              </a>
            </div>
          </div>
        </section>

        {/* ── 3. PROBLEM / EMPATHY ─────────────────────────────────────────── */}
        <section className="bg-[#3A0B22] py-20">
          <div className="container mx-auto px-5 sm:px-8 max-w-3xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-6">
              You have colleagues. That's not the same as friends.
            </h2>
            <p className="text-white/70 leading-relaxed mb-8 max-w-2xl">
              You spend 12-hour shifts surrounded by people. And somehow still feel isolated the moment you leave the building. You want a social life — you just can't build one around rotating call schedules, delayed starts, and cancelled plans. It's not a motivation problem. It's a structure problem.
            </p>
            <div className="space-y-4">
              {[
                { icon: "🔄", text: "Your shifts rotate. Everyone else's plans don't." },
                { icon: "🏥", text: "Your social circle is basically your hospital floor." },
                { icon: "✈️", text: "You moved to Berlin and know no one outside work." },
                { icon: "😮‍💨", text: "Too tired to organise something. Too lonely not to want it." },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <p className="text-white/80 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. BENEFITS ──────────────────────────────────────────────────── */}
        <section className="container mx-auto px-5 sm:px-8 max-w-5xl py-20">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-3 text-center">
            Why BeyondRounds
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1A0A12] text-center mb-12">
            We handle the hard part.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <BenefitCard
              icon={<Shield className="h-5 w-5" />}
              title="Verified doctors only"
              desc="Every member submits a license or hospital ID. You always know you're among peers."
            />
            <BenefitCard
              icon={<Users className="h-5 w-5" />}
              title="Small groups, real conversation"
              desc="3–4 doctors per match. Intimate enough for depth. No awkward large-group energy."
            />
            <BenefitCard
              icon={<MessageCircle className="h-5 w-5" />}
              title="Chat before you meet"
              desc="A private group chat opens on Friday. Break the ice, pick a café, arrive already connected."
            />
            <BenefitCard
              icon={<Calendar className="h-5 w-5" />}
              title="A fresh match every week"
              desc="You're never locked in. Meet new people each Friday, or revisit connections you liked."
            />
            <BenefitCard
              icon={<MapPin className="h-5 w-5" />}
              title="Berlin venue suggestions"
              desc="We suggest local spots — coffee shops, brunch places, canal-side walks. Your group decides."
            />
            <BenefitCard
              icon={<Heart className="h-5 w-5" />}
              title="Built for doctor schedules"
              desc="Choose Friday, Saturday, or Sunday. Cancel by Wednesday 9 pm — no questions asked."
            />
          </div>
        </section>

        {/* ── 5. HOW IT WORKS ──────────────────────────────────────────────── */}
        <section id="how-it-works" className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-3">
            The process
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1A0A12] mb-2">
            From sign-up to coffee in under a week.
          </h2>
          <p className="text-[#5E555B] mb-10 text-sm">
            ✦ Your first match arrives the Friday after your verification is approved.
          </p>
          <div className="space-y-4">
            <StepBubble
              n="1"
              title="Sign up & verify"
              desc="Create a profile and submit your medical license or hospital ID. We verify within 24 hours and confirm by email."
            />
            <StepBubble
              n="2"
              title="Get matched on Friday"
              desc="Every Friday, we match you with 3–4 doctors in Berlin — based on interests, specialty, vibe, and location."
            />
            <StepBubble
              n="3"
              title="Chat, plan, confirm"
              desc="A private in-app group chat opens. We suggest a few local spots. Your group decides together."
            />
            <StepBubble
              n="4"
              title="Show up & connect"
              desc="Brunch, coffee, a canal walk. No agenda. No name badges. Just good company."
            />
          </div>
        </section>

        {/* ── 6. SOCIAL PROOF ──────────────────────────────────────────────── */}
        <section className="bg-[#F6F1EC] border-t border-[#E8DED5] py-20">
          <div className="container mx-auto px-5 sm:px-8 max-w-4xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-3 text-center">
              What doctors say
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1A0A12] text-center mb-12">
              From early members.
            </h2>
            <div className="grid sm:grid-cols-3 gap-5">
              <TestimonialCard
                quote="I've been in Berlin two years and barely knew anyone outside my ward. After two meetups I've found people I actually want to see again."
                name="Dr. S., Internal Medicine"
                role="Charité Berlin"
              />
              <TestimonialCard
                quote="I was sceptical. These things usually feel forced. The group chat before the meetup really helped — we arrived with something to talk about."
                name="Dr. M., Radiology"
                role="DRK Kliniken"
              />
              <TestimonialCard
                quote="As a first-year resident I have almost no free time. But a Saturday brunch with three doctors who get your schedule? Easy to say yes to."
                name="Dr. L., Surgery Resident"
                role="Berlin"
              />
            </div>
            <p className="text-center text-xs text-[#5E555B]/50 mt-6 italic">
              Illustrative examples — names and affiliations anonymized.
            </p>
          </div>
        </section>

        {/* ── 7. PRICING ───────────────────────────────────────────────────── */}
        <section id="pricing" className="bg-[#3A0B22] py-20">
          <div className="container mx-auto px-5 sm:px-8 max-w-5xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F6B4A8] mb-3 text-center">
              Early access
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-center mb-3">
              BeyondRounds — Doctor Matching
            </h2>
            <p className="text-white/60 text-center text-sm mb-14 max-w-md mx-auto">
              Try once, or commit and save. Cancel monthly memberships anytime.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start pt-4">
              <PriceCard
                tag="One-Time Match"
                price="€9.99"
                period=""
                features={["1 curated group match", "30-day chat access", "No commitment"]}
                cta="Try One Match"
              />
              <PriceCard
                tag="Monthly Membership"
                price="€19.99"
                period="/ month"
                features={["Unlimited matches", "Priority matching", "Cancel anytime"]}
                cta="Subscribe Monthly"
              />
              <PriceCard
                tag="3-Month Membership"
                price="€14.99"
                period="/ month"
                billed="€44.97 billed quarterly · Save 25% vs monthly"
                features={["Unlimited matches", "Priority matching", "Save 25% vs monthly"]}
                cta="Best Value"
                badge="Best Value"
              />
              <PriceCard
                tag="6-Month Membership"
                price="€10"
                period="/ month"
                billed="€59.94 billed every 6 months · Save 50% vs monthly"
                features={["Unlimited matches", "Priority matching", "Save 50% vs monthly"]}
                cta="Save Most"
                badge="Save Most"
                accent
              />
            </div>

            {/* 30-day guarantee */}
            <div className="mt-12 max-w-2xl mx-auto bg-white/10 border border-white/15 rounded-[20px] p-6 flex gap-4 items-start">
              <span className="text-2xl shrink-0">🔒</span>
              <div>
                <p className="text-white font-semibold mb-2">The 30-Day Guarantee</p>
                <p className="text-white/70 text-sm leading-relaxed">
                  Subscribe to BeyondRounds. If you don't meet up with at least <strong className="text-white">ONE</strong> group in your first 30 days — choose:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-white/70">
                  <li>→ Full refund</li>
                  <li>→ Extra month free</li>
                </ul>
                <p className="text-white/60 text-sm mt-2">Your choice. Simple as that.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. WAITLIST FORM ─────────────────────────────────────────────── */}
        <section id="waitlist-form" className="container mx-auto px-5 sm:px-8 max-w-2xl py-20">
          <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)]">
            {submitted ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-[#F27C5C]/10 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-8 w-8 text-[#F27C5C]" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-3 text-[#1A0A12]">You're on the list!</h2>
                <p className="text-[#5E555B] mb-6">
                  We'll verify your details within 24 hours. Your first match arrives the following Friday.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-[#3A0B22] border border-[#3A0B22]/20 hover:bg-[#3A0B22]/[0.03] transition-all"
                >
                  Add another email
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-2 text-center">
                  Free to join
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-[#1A0A12] mb-2">
                  Claim your spot.
                </h2>
                <p className="text-[#5E555B] text-center text-sm mb-8">
                  One email to confirm. No spam, no sales sequence.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Row: email + name */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="wl-email" className="text-xs font-semibold text-[#3A0B22] mb-1.5 block">
                        Email address *
                      </label>
                      <input
                        id="wl-email" type="email" required
                        placeholder="you@example.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="wl-name" className="text-xs font-semibold text-[#3A0B22] mb-1.5 block">
                        First name
                      </label>
                      <input
                        id="wl-name" type="text"
                        placeholder="Dr. Anna"
                        value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {/* Row: role + specialty */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="wl-role" className="text-xs font-semibold text-[#3A0B22] mb-1.5 block">
                        Role
                      </label>
                      <select
                        id="wl-role"
                        value={role} onChange={(e) => setRole(e.target.value)}
                        className={`${INPUT_CLASS} appearance-none cursor-pointer ${!role ? 'text-[#5E555B]/50' : ''}`}
                      >
                        <option value="">Select role</option>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="wl-spec" className="text-xs font-semibold text-[#3A0B22] mb-1.5 block">
                        Specialty
                      </label>
                      <select
                        id="wl-spec"
                        value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                        className={`${INPUT_CLASS} appearance-none cursor-pointer ${!specialty ? 'text-[#5E555B]/50' : ''}`}
                      >
                        <option value="">Select specialty</option>
                        {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <p className="text-xs font-semibold text-[#3A0B22] mb-2">Interests (optional)</p>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((i) => (
                        <button
                          key={i} type="button"
                          onClick={() => toggleInterest(i)}
                          className={[
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                            interests.includes(i)
                              ? "bg-[#3A0B22] border-[#3A0B22] text-white"
                              : "bg-white/60 border-[#E8DED5] text-[#5E555B] hover:border-[#3A0B22]/30",
                          ].join(' ')}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Berlin area */}
                  <div>
                    <label htmlFor="wl-area" className="text-xs font-semibold text-[#3A0B22] mb-1.5 block">
                      Berlin area (optional)
                    </label>
                    <select
                      id="wl-area"
                      value={area} onChange={(e) => setArea(e.target.value)}
                      className={`${INPUT_CLASS} appearance-none cursor-pointer ${!area ? 'text-[#5E555B]/50' : ''}`}
                    >
                      <option value="">Select area</option>
                      {BERLIN_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  {/* Consent */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={consent} onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[#E8DED5] accent-[#F27C5C] cursor-pointer"
                    />
                    <span className="text-xs text-[#5E555B] leading-relaxed">
                      I agree to BeyondRounds storing my details to send match-related updates.
                      I can unsubscribe anytime. We never share your data.
                    </span>
                  </label>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 py-3.5 rounded-full bg-[#F27C5C] text-white font-display font-semibold text-base hover:bg-[#e06d4d] active:scale-[0.98] transition-all shadow-md shadow-[#F27C5C]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving your spot…" : "Reserve my spot — it's free"}
                  </button>

                  <p className="text-center text-xs text-[#5E555B]/60">
                    One confirmation email. Nothing else.
                  </p>
                </form>
              </>
            )}
          </div>
        </section>

        {/* ── 9. FAQ ───────────────────────────────────────────────────────── */}
        <section id="faq" className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-3">FAQ</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1A0A12] mb-10">
            Everything you need to know.
          </h2>
          <div className="space-y-3">
            <FaqItem
              q="Who is BeyondRounds for?"
              a="Licensed doctors in Berlin: residents, attendings, specialists, and final-year medical students (PJ). Every member is verified before matching begins — so you always know you're among peers."
            />
            <FaqItem
              q="How does verification work?"
              a="After signing up, upload your medical license number or hospital ID. Our team checks it against official registries within 24 hours. You'll get an email the moment you're approved."
            />
            <FaqItem
              q="How does matching work?"
              a="We match based on your stated interests, Berlin area, specialty, and availability. Groups are kept to 3–4 people by design. The system refines over time — early matches may feel more exploratory."
            />
            <FaqItem
              q="When do matches go out?"
              a="Every Friday. Your private group chat opens the same day so your group has the weekend to plan. Your first match arrives the Friday after your verification is approved."
            />
            <FaqItem
              q="What if I don't click with my group?"
              a="That's normal and expected. You receive a new match the following Friday. You can flag a mismatch in-app and we'll adjust future pairings. No penalty for skipping a week — just cancel by Wednesday 9 pm."
            />
            <FaqItem
              q="Is this only available in Berlin?"
              a="For now, yes. We're building quality before scale. Munich and Frankfurt are planned for 2025. Join with your city and we'll notify you when matching opens near you."
            />
            <FaqItem
              q="How is my data handled?"
              a="We store only what you give us, use it solely for matching, and never share it with third parties. GDPR-compliant. You can delete your account and all data at any time."
            />
            <FaqItem
              q="Is this a dating or networking app?"
              a="No. BeyondRounds is for friendship only. Our matching logic, guidelines, and design reflect that entirely. There's no swipe, no networking agenda."
            />
          </div>
        </section>


      </main>

    </div>
  );
};

export default Waitlist;
