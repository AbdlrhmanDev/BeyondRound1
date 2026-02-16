'use client';

import Image from 'next/image';
import { useModal } from './LandingModalProvider';

export function LandingFinalCTANew() {
  const { openModal } = useModal();

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background photo with plum overlay */}
      <Image
        src="/hero-doctors-friendship.webp"
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#3A0B22]/85" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-3xl text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4 leading-[1.15]">
          Reserve a spot for this weekend.
        </h2>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#F27C5C]/30"
          >
            Reserve my Friday spot
          </button>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white/80 border border-white/20 hover:border-white/40 hover:text-white transition-all duration-200"
          >
            See how it works
          </a>
        </div>

        {/* Footer links */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} BeyondRounds. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-white/70 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white/70 transition-colors">Terms</a>
            <a href="/contact" className="hover:text-white/70 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </section>
  );
}
