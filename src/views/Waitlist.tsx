'use client';

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";
import { useToast } from "@/hooks/use-toast";
import { joinWaitlist, getWaitlistCount } from "@/services/waitlistService";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "next/navigation";

const inputClass = [
  'w-full rounded-[18px] border border-[#E8E0DA] bg-[#FDFBF9] px-4 py-3',
  'text-sm text-[#1A0A12] placeholder:text-[#5E555B]/50',
  'transition-all duration-200 h-12',
  'focus:outline-none focus:border-[#F6B4A8] focus:ring-[3px] focus:ring-[#F6B4A8]/40',
  'hover:border-[#D4C9C1]',
].join(' ');

const medicalSpecialties = [
  "Cardiology", "Dermatology", "Emergency Medicine", "Family Medicine",
  "Internal Medicine", "Neurology", "Oncology", "Pediatrics",
  "Psychiatry", "Surgery", "Other",
];

const Waitlist = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ locale: string }>();
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(500);
  const [animatedCount, setAnimatedCount] = useState(0);
  const countRef = useRef(waitlistCount);
  const animatedCountRef = useRef(animatedCount);

  useEffect(() => { countRef.current = waitlistCount; }, [waitlistCount]);
  useEffect(() => { animatedCountRef.current = animatedCount; }, [animatedCount]);

  const animateCounter = (targetCount: number, startCount?: number) => {
    const start = startCount ?? animatedCountRef.current;
    const duration = 1500;
    const steps = 60;
    const increment = (targetCount - start) / steps;
    const stepDuration = duration / steps;
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= targetCount) || (increment < 0 && current <= targetCount)) {
        setAnimatedCount(targetCount);
        clearInterval(timer);
      } else {
        setAnimatedCount(Math.floor(current));
      }
    }, stepDuration);
    return () => clearInterval(timer);
  };

  const updateWaitlistCount = async (shouldAnimate = true) => {
    try {
      const count = await getWaitlistCount();
      if (count !== countRef.current) {
        setWaitlistCount(count);
        if (shouldAnimate) animateCounter(count);
      }
    } catch (error) {
      console.error("Error fetching waitlist count:", error);
    }
  };

  useEffect(() => {
    getWaitlistCount().then((count) => {
      setWaitlistCount(count);
      animateCounter(count, 0);
    });
    const interval = setInterval(() => updateWaitlistCount(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: t("waitlistPage.toastEmailRequired"), description: t("waitlistPage.toastEmailDesc"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await joinWaitlist({ email, city: city.trim() || undefined, medicalSpecialty: specialty.trim() || undefined });
      if (result.success) {
        setSubmitted(true);
        setEmail(""); setCity(""); setSpecialty("");
        updateWaitlistCount();
        try {
          await fetch('/api/notifications/whitelist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        } catch (emailError) { console.error("Failed to send waitlist confirmation email:", emailError); }
        toast({ title: "You're on the list!", description: "We'll notify you when we launch." });
      } else {
        toast({ title: t("waitlistPage.toastErrorTitle"), description: result.error || t("waitlistPage.toastErrorDesc"), variant: "destructive" });
      }
    } catch (error) {
      console.error("Error submitting waitlist:", error);
      toast({ title: t("waitlistPage.toastErrorTitle"), description: t("waitlistPage.toastGenericDesc"), variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Header */}
      <header className="sticky top-0 z-20">
        <div className="mx-3 mt-3 sm:mx-4 sm:mt-4">
          <div className="bg-[#3A0B22]/90 backdrop-blur-xl border border-white/[0.06] rounded-[20px] shadow-lg shadow-[#3A0B22]/15">
            <div className="container mx-auto px-5 sm:px-6">
              <div className="flex items-center justify-center h-14 sm:h-[60px] relative">
                <LocalizedLink to="/" className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xl text-white italic tracking-tight">
                    Beyond
                  </span>
                  <span className="font-display font-bold text-xl text-[#F6B4A8] italic tracking-tight">
                    Rounds
                  </span>
                </LocalizedLink>

                {!authLoading && user && (
                  <div className="absolute right-5 sm:right-6">
                    <LocalizedLink
                      to="/dashboard"
                      className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] transition-all duration-200 shadow-sm shadow-[#F27C5C]/25"
                    >
                      {t("dashboard")}
                    </LocalizedLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-6 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[#3A0B22] leading-tight">
              {t("waitlistPage.heroTitle")}{" "}
              <span className="text-[#F27C5C]">{t("waitlistPage.heroTitleHighlight")}</span>
            </h1>
            <p className="text-lg md:text-xl text-[#5E555B] mb-12 max-w-2xl mx-auto leading-relaxed">
              {t("waitlistPage.heroSubtitle")}
            </p>

            {/* CTAs */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="#waitlist-form"
                className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#F27C5C]/20"
              >
                {t("waitlistPage.joinWaitlist")}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </a>
              <LocalizedLink
                to="/survey"
                className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-medium text-[#3A0B22] border border-[#3A0B22]/20 hover:border-[#3A0B22]/40 hover:bg-[#3A0B22]/[0.03] transition-all duration-200"
              >
                {t("waitlistPage.takeQuiz")}
              </LocalizedLink>
            </div>
            <p className="mb-14 text-sm text-[#5E555B]/60">
              <LocalizedLink to="/for-doctors" className="underline hover:text-[#5E555B]">
                {t("waitlistPage.whyDoctors")}
              </LocalizedLink>
            </p>

            {/* Counter pill */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 border border-[#E8DED5]/60 shadow-sm">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                <span className="text-2xl font-display font-bold text-[#3A0B22]">
                  {animatedCount.toLocaleString()}+
                </span>
              </div>
              <span className="text-sm text-[#5E555B]">{t("waitlistPage.doctorsJoined")}</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12 text-[#3A0B22] tracking-tight">
              {t("waitlistPage.whyTitle")} <span className="text-[#F27C5C]">{t("waitlistPage.whyHighlight")}</span>{t("waitlistPage.whySuffix")}
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, titleKey: "waitlistPage.verifiedOnly", descKey: "waitlistPage.verifiedOnlyDesc" },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>, titleKey: "waitlistPage.smartMatching", descKey: "waitlistPage.smartMatchingDesc" },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>, titleKey: "waitlistPage.curatedGroups", descKey: "waitlistPage.curatedGroupsDesc" },
              ].map((feature) => (
                <div key={feature.titleKey} className="bg-white/80 border border-[#E8DED5]/60 rounded-[22px] p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="h-12 w-12 rounded-2xl bg-[#F27C5C]/10 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2 text-[#3A0B22]">{t(feature.titleKey)}</h3>
                  <p className="text-sm text-[#5E555B] leading-relaxed">{t(feature.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>, titleKey: "waitlistPage.step1Title", descKey: "waitlistPage.step1Desc" },
                { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, titleKey: "waitlistPage.step2Title", descKey: "waitlistPage.step2Desc" },
                { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>, titleKey: "waitlistPage.step3Title", descKey: "waitlistPage.step3Desc" },
              ].map((step) => (
                <div key={step.titleKey} className="bg-white/80 border border-[#E8DED5]/60 rounded-[22px] p-8 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="h-16 w-16 rounded-2xl bg-[#F27C5C]/10 flex items-center justify-center mx-auto mb-6">
                    {step.icon}
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3 text-[#3A0B22]">{t(step.titleKey)}</h3>
                  <p className="text-[#5E555B] leading-relaxed">{t(step.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section id="waitlist-form" className="container mx-auto px-6 py-16 md:py-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#FAF6F3] border border-[#E8DED5]/60 rounded-[22px] shadow-sm">
              <div className="p-8 md:p-12">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-[#F27C5C]/10 flex items-center justify-center mx-auto mb-6">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-3 text-[#3A0B22]">{t("waitlistPage.successTitle")}</h2>
                    <p className="text-[#5E555B] mb-6">{t("waitlistPage.successDesc")}</p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-[#3A0B22] border border-[#3A0B22]/20 hover:bg-[#3A0B22]/[0.03] transition-all duration-200"
                    >
                      {t("waitlistPage.addAnotherEmail")}
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-center text-[#3A0B22] tracking-tight">
                      {t("waitlistPage.formTitle")} <span className="text-[#F27C5C]">{t("waitlistPage.formTitleHighlight")}</span>
                    </h2>
                    <p className="text-[#5E555B] text-center mb-8">
                      {t("waitlistPage.formSubtitle")}
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium mb-2 text-[#3A0B22]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                          {t("waitlistPage.emailLabel")}
                        </label>
                        <input
                          id="email"
                          type="email"
                          placeholder={t("waitlistPage.emailPlaceholder")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label htmlFor="city" className="flex items-center gap-2 text-sm font-medium mb-2 text-[#3A0B22]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          {t("waitlistPage.cityLabel")}
                        </label>
                        <input
                          id="city"
                          type="text"
                          placeholder={t("waitlistPage.cityPlaceholder")}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      {/* Specialty */}
                      <div>
                        <label htmlFor="specialty" className="flex items-center gap-2 text-sm font-medium mb-2 text-[#3A0B22]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" /></svg>
                          {t("waitlistPage.specialtyLabel")}
                        </label>
                        <select
                          id="specialty"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className={`${inputClass} appearance-none cursor-pointer ${!specialty ? 'text-[#5E555B]/50' : ''}`}
                        >
                          <option value="">{t("waitlistPage.specialtyPlaceholder")}</option>
                          {medicalSpecialties.map((spec) => (
                            <option key={spec} value={spec}>
                              {t(`waitlistPage.specialties.${spec}`)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-full bg-[#F27C5C] text-white font-semibold text-base hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-[#F27C5C]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? t("waitlistPage.submitting") : t("waitlistPage.submitButton")}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Waitlist;
