'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LandingHeroProps {
  translations: {
    headline: string;
    subheadline: string;
    subheadline2: string;
    limitedSpots: string;
    limitedSpotsCount: string;
    registrationClosesIn: string;
    cta: string;
    ctaHowItWorks: string;
    verifiedOnly: string;
    smallGroups: string;
    weekendMeetups: string;
  };
}

/** Countdown to next Friday 18:00 Berlin time */
function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function getNextFriday() {
      const now = new Date();
      const day = now.getDay(); // 0=Sun
      let daysUntilFri = (5 - day + 7) % 7;
      if (daysUntilFri === 0) {
        // If it's Friday, check if past 18:00
        if (now.getHours() >= 18) daysUntilFri = 7;
      }
      const target = new Date(now);
      target.setDate(target.getDate() + daysUntilFri);
      target.setHours(18, 0, 0, 0);
      return target;
    }

    function update() {
      const diff = Math.max(0, getNextFriday().getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function LandingHero({ translations: tt }: LandingHeroProps) {
  const { days, hours, minutes, seconds } = useCountdown();

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background photo */}
      <Image
        src="/hero-doctors-friendship.webp"
        alt="Doctors enjoying a relaxed dinner together"
        fill
        priority
        className="object-cover"
        sizes="100vw"
        quality={85}
      />

      {/* Gradient overlay: plum top → transparent */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/70 via-[#3A0B22]/40 to-[#3A0B22]/60" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-4xl text-center pt-28 pb-16">
        {/* Brand label */}
        <p className="text-[#F6B4A8] text-xs sm:text-sm font-medium tracking-[0.2em] uppercase mb-6">
          BEYONDROUNDS
        </p>

        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.15] mb-6 max-w-3xl mx-auto">
          {tt.headline}
        </h1>

        {/* Subheadline */}
        <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          {tt.subheadline}<br />
          {tt.subheadline2}
        </p>

        {/* Scarcity box */}
        <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 sm:px-8 py-4 mb-8">
          <p className="text-white font-semibold text-sm mb-1">{tt.limitedSpots}</p>
          <p className="text-white/70 text-sm mb-2">
            {tt.limitedSpotsCount}
          </p>
          <p className="text-white/60 text-xs">
            {tt.registrationClosesIn}{' '}
            <span className="text-white font-bold font-mono">
              {pad(days)}d : {pad(hours)}h : {pad(minutes)}m : {pad(seconds)}s
            </span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <a
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#F27C5C]/30"
            aria-label={tt.cta}
          >
            {tt.cta}
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white/90 border border-white/30 hover:border-white/50 hover:bg-white/5 transition-all duration-200"
          >
            {tt.ctaHowItWorks}
          </a>
        </div>

        {/* Trust bullets */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F6B4A8" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
            {tt.verifiedOnly}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F6B4A8" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
            {tt.smallGroups}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F6B4A8" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
            {tt.weekendMeetups}
          </span>
        </div>
      </div>
    </section>
  );
}
