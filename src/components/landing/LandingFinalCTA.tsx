import { LandingCTAButton } from './LandingCTAButton';

interface LandingFinalCTAProps {
  t: (key: string) => string;
}

export function LandingFinalCTA({ t }: LandingFinalCTAProps) {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          {t('landing.finalTitle')}
        </h2>
        <p className="text-gray-600 text-lg mb-10 max-w-xl mx-auto">
          {t('landing.finalSubtitle')}
        </p>
        <LandingCTAButton label={t('landing.finalCTA')} />
        <p className="mt-4 text-xs text-gray-400">{t('landing.heroMicrocopy')}</p>
      </div>
    </section>
  );
}
