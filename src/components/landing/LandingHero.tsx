import { LandingCTAButton } from './LandingCTAButton';

interface LandingHeroProps {
  t: (key: string) => string;
}

export function LandingHero({ t }: LandingHeroProps) {
  return (
    <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center">
        {/* Micro-proof bar */}
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
          <span className="text-sm font-medium text-emerald-700">{t('landing.heroBadge')}</span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
          {t('landing.heroHeadline')}
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          {t('landing.heroSubheadline')}
        </p>

        {/* Trust bullets */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 mb-8">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><path d="M20 6 9 17l-5-5" /></svg>
            {t('landing.heroTrust1')}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><path d="M20 6 9 17l-5-5" /></svg>
            {t('landing.heroTrust2')}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><path d="M20 6 9 17l-5-5" /></svg>
            {t('landing.heroTrust3')}
          </span>
        </div>

        {/* Mechanism sentence */}
        <p className="text-sm text-gray-500 mb-10 max-w-lg mx-auto">
          {t('landing.heroMechanism')}
        </p>

        {/* CTA */}
        <LandingCTAButton label={t('landing.heroCTA')} />

        <p className="mt-4 text-xs text-gray-400">{t('landing.heroMicrocopy')}</p>
      </div>
    </section>
  );
}
