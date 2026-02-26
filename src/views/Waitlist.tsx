'use client';

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { joinWaitlist, getWaitlistCount } from "@/services/waitlistService";
import { useAuth } from "@/hooks/useAuth";
import LocalizedLink from "@/components/LocalizedLink";
import {
  Shield, Users, Calendar,
  Check
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Main component ───────────────────────────────────────────────────────────

const Waitlist = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
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

  const params = useParams();
  const locale = params?.locale as string || 'en';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await joinWaitlist({ email });
      if (result.success) {
        setSubmitted(true);
        setEmail("");
        try {
          await fetch('/api/notifications/whitelist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, locale }),
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

  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      <header className="sticky top-0 z-30">
        <div className="mx-3 mt-3 sm:mx-4 sm:mt-4">
          <div className="bg-[#3A0B22]/90 backdrop-blur-xl border border-white/[0.06] rounded-[20px] shadow-lg shadow-[#3A0B22]/15">
            <div className="container mx-auto px-5 sm:px-6">
              <div className="flex items-center h-14 sm:h-[60px]">
                <LocalizedLink to="/" className="flex items-center gap-0.5 mr-auto">
                  <span className="font-display font-bold text-xl text-white italic tracking-tight">Beyond</span>
                  <span className="font-display font-bold text-xl text-[#F6B4A8] italic tracking-tight">Rounds</span>
                </LocalizedLink>

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
              Every week, we match you with 3–4 verified doctors who share your interests.
            </p>

            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 border border-[#E8DED5]/60 shadow-sm mb-10">
              <span className="font-display text-2xl font-bold text-[#3A0B22]">{animatedCount.toLocaleString()}+</span>
              <span className="text-sm text-[#5E555B]">doctors already joined</span>
            </div>

            <div id="waitlist-form" className="max-w-md mx-auto">
              {submitted ? (
                <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 text-center shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-[#F27C5C]/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-6 w-6 text-[#F27C5C]" />
                  </div>
                  <h2 className="font-display text-xl font-bold mb-2 text-[#1A0A12]">You're on the list!</h2>
                  <p className="text-sm text-[#5E555B]">We'll be in touch soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your doctor email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-full border border-[#E8DED5] bg-white px-6 py-4 text-sm focus:outline-none focus:border-[#F27C5C] focus:ring-4 focus:ring-[#F27C5C]/10 transition-all h-14"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-14 px-8 rounded-full bg-[#3A0B22] text-white font-semibold text-sm hover:bg-[#4B0F2D] transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-[#3A0B22]/10"
                  >
                    {loading ? "Joining..." : "Join the Waitlist"}
                  </button>
                </form>
              )}
              <p className="mt-4 text-xs text-[#5E555B]/60 italic font-medium">
                🛡️ Verified doctors only. No spam, ever.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#3A0B22] py-20">
          <div className="container mx-auto px-5 sm:px-8 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-[#F27C5C]/20 flex items-center justify-center text-[#F6B4A8]">
                  <Shield size={20} />
                </div>
                <h3 className="font-display text-lg font-bold text-white">Verified Peer Groups</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Every member is a licensed physician. We verify identities within 24 hours.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-[#F27C5C]/20 flex items-center justify-center text-[#F6B4A8]">
                  <Users size={20} />
                </div>
                <h3 className="font-display text-lg font-bold text-white">Curated Matching</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Meet 3-4 doctors who share your interests, specialty, and lifestyle.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-[#F27C5C]/20 flex items-center justify-center text-[#F6B4A8]">
                  <Calendar size={20} />
                </div>
                <h3 className="font-display text-lg font-bold text-white">Weekly Meetings</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  New matches every Friday. Plan your weekend meetup in a private chat.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-[#E8DED5]">
        <div className="container mx-auto px-5 text-center">
          <p className="text-sm text-[#5E555B]/60">
            © 2026 BeyondRounds Berlin. Built for doctors, by doctors.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Waitlist;
