'use client';

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { joinWaitlist } from "@/services/waitlistService";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LocalizedLink from "@/components/LocalizedLink";
import { LanguageLinks } from "@/components/marketing/LanguageLinks";
import {
  Check, ChevronDown, Lock, CheckCircle2, UserCheck, Settings, Users, ArrowRight, Instagram
} from "lucide-react";

const translations = {
  en: {
    dashboard: "Dashboard",
    joinWaitlist: "Join Waitlist",
    badge: "Berlin · Verified Doctors Only",
    heroTitle1: "Stop relying on coworkers for a social life.",
    heroTitle2: "Meet doctors in Berlin weekly.",
    heroDesc: "We match you based on interests + availability — so you actually meet, not just chat.",
    whitelistSuccess: "You're on the whitelist",
    whitelistSuccessDesc: "We'll send you an invite as soon as a spot opens.",
    emailPlaceholder: "Enter your email address",
    joinBtn: "Join the Founding List",
    joiningBtn: "Joining...",
    noSpam: "No spam. Unsubscribe anytime. Verification happens after signup.",
    perk1: "New groups open weekly",
    perk2: "Verified doctors only",
    perk3: "You choose what activities you do",
    launchNotice: "Pilot launching March 2026 — early invites first",
    builtBy: "Built by doctors for doctors.",
    howItWorks: "How It Works",
    step1Title: "Sign Up & Get Verified",
    step1Desc: "We verify every member using their medical license or institutional email to ensure a safe, private community.",
    step2Title: "Set Your Preferences",
    step2Desc: "Tell us what you like to do: morning coffee, after-work dinner, bouldering, or just a quiet park walk.",
    step3Title: "Meet Your Group",
    step3Desc: "Every week, we match you with 3-4 peers. We suggest the venue, you just show up and connect.",
    forWho: "Designed for the Busy Physician",
    forWhoDesc: "For the doctor in Berlin who wants genuine connection outside the hospital walls.",
    tired1: "You're tired of talking about patients on your days off.",
    tired2: 'You want to explore the city with people who "get" your chaotic schedule.',
    tired3: "You value low-pressure, small group settings over massive awkward networking events.",
    getEarlyAccess: "Get Early Access",
    privacyTitle: "Your privacy is our priority.",
    privacyDesc: "We know how important discretion is in the medical field. Our platform is built with privacy-first principles.",
    readPrivacy: "Read our Privacy Policy",
    priv1: "Strictly verified medical professionals only.",
    priv2: "Private matching. Profiles are never public.",
    priv3: "Zero tolerance for unprofessional behavior.",
    quickQuestions: "Quick Questions",
    finalTitle1: "Ready to Stop Being",
    finalTitle2: "Lonely?",
    finalSubtitle: "Pilot launching soon — early invites first.",
    finalSuccess: "You're on the list!",
    finalSuccessDesc: "Keep an eye on your inbox.",
    finalLaunchNotice: "Pilot launches March 2026. Early signups get first access.",
    footerSubtitle: "Real connections for medical professionals.",
    rights: "All rights reserved.",
    faq1q: "Who can join?",
    faq1a: "Only verified medical doctors (Approbation) currently working or living in Berlin.",
    faq2q: "How much does it cost?",
    faq2a: "The early pilot is 100% free for our founding members.",
    faq3q: "Do I have to meet every week?",
    faq3a: "No, you can pause or opt-out any week. You only get matched when you declare you're available.",
    faq4q: "Is this a dating service?",
    faq4a: "No. Beyond Rounds is strictly for building professional networks, peer support, and genuine friendships."
  },
  de: {
    dashboard: "Dashboard",
    joinWaitlist: "Auf die Warteliste",
    badge: "Berlin · Nur verifizierte Ärzt:innen",
    heroTitle1: "Sozialleben ohne ständige Klinik-Gespräche.",
    heroTitle2: "Triff wöchentlich Ärzt:innen in Berlin.",
    heroDesc: "Wir matchen nach Interessen + Verfügbarkeit — für echte Treffen, statt endloser Chats.",
    whitelistSuccess: "Du stehst auf der Liste",
    whitelistSuccessDesc: "Wir melden uns, sobald ein Platz frei wird.",
    emailPlaceholder: "Deine E-Mail-Adresse",
    joinBtn: "Auf die Founding List",
    joiningBtn: "Wird eingetragen...",
    noSpam: "Kein Spam. Jederzeit abmeldbar. Verifizierung nach Anmeldung.",
    perk1: "Jede Woche neue Gruppen",
    perk2: "Nur verifizierte Ärzt:innen",
    perk3: "Du wählst die Aktivitäten",
    launchNotice: "Pilotstart März 2026 — Einladungen zuerst an Early Birds",
    builtBy: "Von Ärzt:innen für Ärzt:innen.",
    howItWorks: "So funktioniert es",
    step1Title: "Anmelden & Verifizieren",
    step1Desc: "Wir verifizieren jedes Mitglied per Arztausweis oder Klinik-E-Mail für eine sichere Community.",
    step2Title: "Interessen wählen",
    step2Desc: "Sag uns, was du gerne machst: Kaffee am Morgen, Dinner nach Dienstschluss, Bouldern oder Spaziergang.",
    step3Title: "Gruppe treffen",
    step3Desc: "Jede Woche ein Match mit 3-4 Kolleg:innen. Wir schlagen den Ort vor, du kommst einfach dazu.",
    forWho: "Entwickelt für den Klinikalltag",
    forWhoDesc: "Für Berliner Ärzt:innen, die echte Verbindungen jenseits der Klinikwände suchen.",
    tired1: "Du hast keine Lust, auch am Wochenende über Patienten zu reden.",
    tired2: 'Du willst die Stadt mit Leuten erkunden, die deinen chaotischen Dienstplan verstehen.',
    tired3: "Du bevorzugst entspannte Runden in kleinen Gruppen statt steifer Networking-Events.",
    getEarlyAccess: "Early Access sichern",
    privacyTitle: "Deine Privatsphäre hat Priorität.",
    privacyDesc: "Wir wissen um die Bedeutung von Diskretion im medizinischen Bereich.",
    readPrivacy: "Zur Datenschutzerklärung",
    priv1: "Ausschließlich verifizierte Mediziner:innen.",
    priv2: "Privates Matching. Profile sind nie öffentlich sichtbar.",
    priv3: "Null Toleranz für unprofessionelles Verhalten.",
    quickQuestions: "Häufige Fragen",
    finalTitle1: "Bereit für echte",
    finalTitle2: "Kontakte?",
    finalSubtitle: "Der Pilot startet bald — Early Invites zuerst.",
    finalSuccess: "Du stehst auf der Liste!",
    finalSuccessDesc: "Behalte deinen Posteingang im Auge.",
    finalLaunchNotice: "Pilotstart März 2026. Frühe Anmeldungen erhalten zuerst Zugang.",
    footerSubtitle: "Echte Verbindungen für Medizin-Professionals.",
    rights: "Alle Rechte vorbehalten.",
    faq1q: "Wer kann teilnehmen?",
    faq1a: "Nur verifizierte Ärzt:innen (Approbation), die aktuell in Berlin arbeiten.",
    faq2q: "Was kostet es?",
    faq2a: "Die frühe Pilotphase ist für unsere Gründungsmitglieder 100% kostenlos.",
    faq3q: "Muss ich mich jede Woche treffen?",
    faq3a: "Nein, du kannst jederzeit pausieren. Du wirst nur gematcht, wenn du Zeit hast.",
    faq4q: "Ist das eine Dating-Plattform?",
    faq4a: "Nein. Beyond Rounds dient ausschließlich dem Aufbau professioneller Netzwerke und echten Freundschaften."
  }
} as const;

type Locale = keyof typeof translations;

const getFAQ = (t: typeof translations[Locale]) => [
  { q: t.faq1q, a: t.faq1a },
  { q: t.faq2q, a: t.faq2a },
  { q: t.faq3q, a: t.faq3a },
  { q: t.faq4q, a: t.faq4a }
];

const AccordionItem = ({ q, a }: { q: string, a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#1C1917]/10 rounded-2xl bg-white mb-4 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
      <button 
        onClick={() => setOpen(!open)} 
        className="w-full text-left px-6 py-5 flex items-center justify-between font-semibold text-[#1C1917] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F26449]"
        aria-expanded={open}
      >
        <span className="text-lg">{q}</span>
        <ChevronDown className={`w-5 h-5 text-[#57534E] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div 
        className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${open ? 'pb-6 max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
        aria-hidden={!open}
      >
        <p className="text-[#57534E] leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

export default function Waitlist() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  
  // Safely get locale and fallback to 'en'
  const localeParam = params?.locale as string;
  const currentLocale: Locale = localeParam === 'de' ? 'de' : 'en';
  const t = translations[currentLocale];

  // Form State
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: "Valid email required", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await joinWaitlist({ email });
      if (result.success) {
        setSubmitted(true);
        setEmail("");
        fetch('/api/notifications/whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, locale: currentLocale }),
        }).catch(() => {});
      } else {
        toast({ title: "Something went wrong", description: result.error ?? "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Please try again.", variant: "destructive" });
    } finally { 
      setLoading(false); 
    }
  };

  const currentFAQ = getFAQ(t);

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans selection:bg-[#F26449]/20">
      
      {/* Top Bar (Burgundy) */}
      <header className="sticky top-0 z-50 bg-[#4A1526] text-[#FAF7F2] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="font-bold text-lg sm:text-xl tracking-tight">Beyond Rounds</div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageLinks variant="overlay" className="border-white/10" />
            {!authLoading && user ? (
              <LocalizedLink
                to="/dashboard"
                className="h-8 sm:h-9 px-4 sm:px-5 rounded-full bg-[#F26449] text-white font-semibold text-xs sm:text-sm hover:bg-[#E05A3E] transition-colors shadow-sm flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4A1526]"
              >
                {t.dashboard}
              </LocalizedLink>
            ) : (
              <a
                href="#join"
                className="h-8 sm:h-9 px-4 sm:px-5 rounded-full bg-[#F26449] text-white font-semibold text-xs sm:text-sm hover:bg-[#E05A3E] transition-colors shadow-sm flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4A1526]"
              >
                {t.joinWaitlist}
              </a>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section (Cream) */}
        <section className="pt-20 pb-24 sm:pt-28 sm:pb-32 px-5 sm:px-8 bg-[#FAF7F2]">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block py-1.5 px-3 rounded-full bg-[#4A1526]/5 text-[#4A1526] text-xs font-bold tracking-widest uppercase mb-8">
              {t.badge}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#1C1917] tracking-tight leading-[1.15] mb-6">
              {t.heroTitle1} <br className="hidden sm:block" />
              <span className="text-[#4A1526]">{t.heroTitle2}</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#57534E] max-w-2xl mx-auto leading-relaxed mb-10">
              {t.heroDesc}
            </p>

            <div id="join" className="max-w-md mx-auto mb-6">
              {submitted ? (
                <div className="bg-white border border-[#4A1526]/10 rounded-2xl p-8 shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-[#F26449] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#1C1917] mb-2">{t.whitelistSuccess}</h3>
                  <p className="text-[#57534E]">{t.whitelistSuccessDesc}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-12 sm:h-14 rounded-2xl border border-gray-200 bg-white px-5 text-[#1C1917] placeholder-[#57534E]/60 focus:outline-none focus:border-[#F26449] focus:ring-4 focus:ring-[#F26449]/10 transition-shadow text-sm sm:text-base shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-[#F26449] text-white font-semibold text-sm sm:text-base hover:bg-[#E05A3E] transition-all disabled:opacity-50 whitespace-nowrap shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#F26449]/20"
                  >
                    {loading ? t.joiningBtn : t.joinBtn}
                  </button>
                </form>
              )}
            </div>

            <p className="text-sm text-[#57534E] mb-12">
              {t.noSpam}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm font-medium text-[#1C1917] mb-12">
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[#F26449]" /> {t.perk1}
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[#F26449]" /> {t.perk2}
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[#F26449]" /> {t.perk3}
              </span>
            </div>

            <div className="pt-8 border-t border-[#1C1917]/10 flex flex-col items-center justify-center gap-2">
              <span className="text-[#57534E] font-medium text-sm border px-4 py-1.5 border-[#1C1917]/10 rounded-full bg-white shadow-sm">
                {t.launchNotice}
              </span>
              <span className="text-[#57534E] text-sm mt-3 font-serif italic">
                {t.builtBy}
              </span>
            </div>
          </div>
        </section>

        {/* How It Works Section (White) */}
        <section className="py-24 bg-white px-5 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1C1917] mb-16 tracking-tight">
              {t.howItWorks}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="bg-[#FAF7F2] p-8 rounded-[24px] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#4A1526] rounded-2xl flex items-center justify-center text-white mb-6 shadow-sm">
                  <UserCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1917] mb-3">{t.step1Title}</h3>
                <p className="text-[#57534E] leading-relaxed">
                  {t.step1Desc}
                </p>
              </div>
              {/* Step 2 */}
              <div className="bg-[#FAF7F2] p-8 rounded-[24px] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#4A1526] rounded-2xl flex items-center justify-center text-white mb-6 shadow-sm">
                  <Settings className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1917] mb-3">{t.step2Title}</h3>
                <p className="text-[#57534E] leading-relaxed">
                  {t.step2Desc}
                </p>
              </div>
              {/* Step 3 */}
              <div className="bg-[#4A1526] p-8 rounded-[24px] shadow-md hover:shadow-lg transition-shadow relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Users className="w-32 h-32" />
                </div>
                <div className="w-14 h-14 bg-[#F26449] rounded-2xl flex items-center justify-center text-white mb-6 shadow-sm relative z-10">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10">{t.step3Title}</h3>
                <p className="text-white/80 leading-relaxed relative z-10">
                  {t.step3Desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For Section (Cream) */}
        <section className="py-24 bg-[#FAF7F2] px-5 sm:px-8 border-y border-[#1C1917]/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1C1917] mb-6 tracking-tight">
              {t.forWho}
            </h2>
            <p className="text-lg text-[#57534E] mb-12 max-w-2xl mx-auto">
              {t.forWhoDesc}
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left mb-12">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#1C1917]/5">
                <p className="text-[#1C1917] font-medium flex gap-3">
                  <span className="text-[#F26449] mt-0.5">✖</span>
                  {t.tired1}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#1C1917]/5">
                <p className="text-[#1C1917] font-medium flex gap-3">
                  <span className="text-[#F26449] mt-0.5">✖</span>
                  {t.tired2}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#1C1917]/5 sm:col-span-2">
                <p className="text-[#1C1917] font-medium flex gap-3">
                  <span className="text-[#F26449] mt-0.5">✖</span>
                  {t.tired3}
                </p>
              </div>
            </div>

            <a
              href="#join"
              className="inline-flex h-14 items-center px-10 rounded-2xl bg-[#1C1917] text-white font-semibold text-lg hover:bg-[#292524] transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-[#1C1917]/20"
            >
              {t.getEarlyAccess}
            </a>
          </div>
        </section>

        {/* Privacy & Safety Section (White) */}
        <section className="py-24 bg-white px-5 sm:px-8">
          <div className="max-w-5xl mx-auto rounded-[32px] bg-[#FAF7F2] p-10 sm:p-16 border border-[#1C1917]/5 text-center sm:text-left flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#4A1526] mb-6 mx-auto sm:mx-0">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-[#1C1917] mb-4 tracking-tight">{t.privacyTitle}</h2>
              <p className="text-lg text-[#57534E] mb-6">
                {t.privacyDesc}
              </p>
              <a href="#" className="font-semibold text-[#4A1526] hover:text-[#5E1B31] underline underline-offset-4">
                {t.readPrivacy}
              </a>
            </div>
            <div className="md:w-1/2 space-y-4">
              <div className="flex bg-white p-5 rounded-2xl shadow-sm border border-[#1C1917]/5 gap-4 text-left">
                <Lock className="w-6 h-6 text-[#F26449] shrink-0" />
                <span className="font-medium text-[#1C1917]">{t.priv1}</span>
              </div>
              <div className="flex bg-white p-5 rounded-2xl shadow-sm border border-[#1C1917]/5 gap-4 text-left">
                <Lock className="w-6 h-6 text-[#F26449] shrink-0" />
                <span className="font-medium text-[#1C1917]">{t.priv2}</span>
              </div>
              <div className="flex bg-white p-5 rounded-2xl shadow-sm border border-[#1C1917]/5 gap-4 text-left">
                <Lock className="w-6 h-6 text-[#F26449] shrink-0" />
                <span className="font-medium text-[#1C1917]">{t.priv3}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Questions FAQ (Cream) */}
        <section className="py-24 bg-[#FAF7F2] px-5 sm:px-8 bg-gradient-to-b from-white to-[#FAF7F2]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1C1917] mb-12 text-center tracking-tight">
              {t.quickQuestions}
            </h2>
            <div className="space-y-1 text-left">
              {currentFAQ.map((faq, i) => (
                <AccordionItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section (Burgundy) */}
        <section className="py-24 bg-[#391823] px-5 sm:px-8">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#FAF7F2] mb-4 tracking-tight leading-tight">
              {t.finalTitle1}<br className="hidden sm:block" /> {t.finalTitle2}
            </h2>
            <p className="text-xl sm:text-2xl text-[#FAF7F2]/90 mb-10 font-medium">
              {t.finalSubtitle}
            </p>

            <div className="mb-6 max-w-lg mx-auto">
              {submitted ? (
                <div className="bg-[#4a2434] border border-white/5 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-white mb-1">{t.finalSuccess}</h3>
                  <p className="text-white/80">{t.finalSuccessDesc}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <input
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-12 sm:h-14 rounded-2xl border-none bg-[#4a2434] px-5 sm:px-6 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#F26449] transition-all text-sm sm:text-base shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-[#E26A4F] text-white font-semibold text-base hover:bg-[#d05c43] transition-all disabled:opacity-50 shadow-md focus:outline-none focus:ring-4 focus:ring-[#E26A4F]/30 whitespace-nowrap"
                  >
                    {loading ? t.joiningBtn : t.joinBtn}
                  </button>
                </form>
              )}
            </div>
            <p className="text-[#FAF7F2]/60 text-sm">
              {t.finalLaunchNotice}
            </p>
          </div>
        </section>
      </main>

      {/* Footer (Cream) */}
      <footer className="py-16 bg-[#FAF7F2] border-t border-[#1C1917]/10 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div>
            <div className="font-bold text-xl tracking-tight text-[#4A1526] mb-2">Beyond Rounds</div>
            <p className="text-[#57534E]">{t.footerSubtitle}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center text-[#57534E] font-medium">
            <a href="mailto:hello@beyondrounds.com" className="hover:text-[#F26449] transition-colors">hello@beyondrounds.com</a>
            <a href="https://www.instagram.com/beyondroundsapp?igsh=NHNlaXozajhhamR1" className="flex items-center gap-2 hover:text-[#F26449] transition-colors">
              <Instagram className="w-5 h-5" />
              Instagram
            </a>
            <a href="#" className="hover:text-[#F26449] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#F26449] transition-colors">Terms of Service</a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-[#1C1917]/10 text-center text-[#57534E] text-sm">
          © 2026 Beyond Rounds Berlin. {t.rights}
        </div>
      </footer>
    </div>
  );
}
