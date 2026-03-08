'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Instagram } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { joinWaitlist } from '@/services/waitlistService';
import { LanguageLinks } from '@/components/marketing/LanguageLinks';

const t = {
  en: {
    badge: 'Berlin · Verified Doctors Only',
    headline: 'Something is coming.',
    subheadline: 'BeyondRounds matches verified doctors in Berlin into small groups for real weekend meetups — no swiping, no awkward networking.',
    emailPlaceholder: 'Enter your email address',
    cta: 'Notify me at launch',
    ctaLoading: 'Joining...',
    noSpam: 'No spam. Unsubscribe anytime.',
    successTitle: "You're on the list",
    successDesc: "We'll send you an invite as soon as we launch.",
    launchNotice: 'Launching in Berlin — 2026',
    builtBy: 'Built by doctors, for doctors.',
    footerRights: 'All rights reserved.',
  },
  de: {
    badge: 'Berlin · Nur verifizierte Ärzt:innen',
    headline: 'Es kommt etwas.',
    subheadline: 'BeyondRounds bringt verifizierte Ärzt:innen in Berlin in kleinen Gruppen für echte Wochenend-Treffen zusammen — kein Swipen, kein steifes Netzwerken.',
    emailPlaceholder: 'Deine E-Mail-Adresse',
    cta: 'Beim Launch benachrichtigen',
    ctaLoading: 'Wird eingetragen...',
    noSpam: 'Kein Spam. Jederzeit abmeldbar.',
    successTitle: 'Du stehst auf der Liste',
    successDesc: 'Wir schicken dir eine Einladung, sobald wir starten.',
    launchNotice: 'Start in Berlin — 2026',
    builtBy: 'Von Ärzt:innen für Ärzt:innen.',
    footerRights: 'Alle Rechte vorbehalten.',
  },
} as const;

type Locale = keyof typeof t;

export default function ComingSoon() {
  const { toast } = useToast();
  const params = useParams();
  const locale: Locale = params?.locale === 'de' ? 'de' : 'en';
  const copy = t[locale];

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: 'Valid email required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await joinWaitlist({ email });
      if (result.success) {
        setSubmitted(true);
        setEmail('');
        fetch('/api/notifications/whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, locale }),
        }).catch(() => {});
      } else {
        toast({ title: 'Something went wrong', description: result.error ?? 'Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#4A1526] text-[#FAF7F2] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">Beyond Rounds</span>
          <LanguageLinks variant="overlay" className="border-white/10" />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-lg w-full text-center"
        >
          {/* Badge */}
          <span className="inline-block py-1.5 px-4 rounded-full bg-[#4A1526]/8 text-[#4A1526] text-xs font-bold tracking-widest uppercase mb-8">
            {copy.badge}
          </span>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-extrabold text-[#1C1917] tracking-tight leading-[1.1] mb-6">
            {copy.headline}
          </h1>

          {/* Sub */}
          <p className="text-lg text-[#57534E] leading-relaxed mb-12 max-w-md mx-auto">
            {copy.subheadline}
          </p>

          {/* Form */}
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-[#4A1526]/10 rounded-2xl p-8 shadow-sm"
            >
              <CheckCircle2 className="w-12 h-12 text-[#F26449] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#1C1917] mb-2">{copy.successTitle}</h3>
              <p className="text-[#57534E]">{copy.successDesc}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="email"
                required
                placeholder={copy.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-14 rounded-2xl border border-[#1C1917]/10 bg-white px-5 text-[#1C1917] placeholder-[#57534E]/50 focus:outline-none focus:border-[#F26449] focus:ring-4 focus:ring-[#F26449]/10 transition-all shadow-sm text-base"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-14 px-7 rounded-2xl bg-[#4A1526] text-white font-bold text-base hover:bg-[#5E1B31] transition-all disabled:opacity-50 shadow-md whitespace-nowrap shrink-0 focus:outline-none focus:ring-4 focus:ring-[#4A1526]/20"
              >
                {loading ? copy.ctaLoading : copy.cta}
              </button>
            </form>
          )}

          {!submitted && (
            <p className="text-sm text-[#57534E]/70 mb-12">{copy.noSpam}</p>
          )}

          {/* Launch notice */}
          <div className="pt-8 border-t border-[#1C1917]/10 flex flex-col items-center gap-3">
            <span className="text-sm text-[#57534E] font-medium border px-4 py-1.5 border-[#1C1917]/10 rounded-full bg-white shadow-sm">
              {copy.launchNotice}
            </span>
            <span className="text-sm text-[#57534E] font-serif italic">{copy.builtBy}</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1C1917]/10 py-8 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#57534E]">
          <span className="font-bold text-[#4A1526]">Beyond Rounds</span>
          <div className="flex items-center gap-6">
            <a
              href="https://www.instagram.com/beyondroundsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-[#F26449] transition-colors"
            >
              <Instagram className="w-4 h-4" />
              Instagram
            </a>
            <a href="mailto:hello@beyondrounds.app" className="hover:text-[#F26449] transition-colors">
              hello@beyondrounds.app
            </a>
          </div>
          <span>© 2026 Beyond Rounds. {copy.footerRights}</span>
        </div>
      </footer>
    </div>
  );
}
