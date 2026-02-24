import Image from 'next/image';

interface LandingFinalCTANewProps {
  t: (key: string) => string;
}

export function LandingFinalCTANew({ t }: LandingFinalCTANewProps) {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&h=900&fit=crop&q=85"
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        aria-hidden
      />
      {/* Plum overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3A0B22]/90 via-[#3A0B22]/80 to-[#2D0819]/90" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-3xl text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4 leading-[1.15]">
          {t('landing.finalCTATitle')}
        </h2>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <a
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#F27C5C]/30"
            aria-label={t('landing.finalCTAButton')}
          >
            {t('landing.finalCTAButton')}
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white/80 border border-white/20 hover:border-white/40 hover:text-white transition-all duration-200"
          >
            {t('landing.finalCTAHow')}
          </a>
        </div>
      </div>
    </section>
  );
}
