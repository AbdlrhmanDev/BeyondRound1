import { LandingCTAButton } from './LandingCTAButton';

interface LandingOfferProps {
  t: (key: string) => string;
}

export function LandingOffer({ t }: LandingOfferProps) {
  return (
    <section className="py-20 sm:py-28 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            {t('landing.offerTitle')}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('landing.offerSubtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Trial card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-display font-semibold text-gray-900 mb-1">{t('landing.offerTrialName')}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{t('landing.offerTrialPrice')}</p>
            <p className="text-gray-500 text-sm mb-6">{t('landing.offerTrialDesc')}</p>
            <ul className="space-y-3 mb-6">
              {['offerTrialF1', 'offerTrialF2', 'offerTrialF3'].map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(152, 60%, 36%)" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M20 6 9 17l-5-5" /></svg>
                  {t(`landing.${key}`)}
                </li>
              ))}
            </ul>
            <LandingCTAButton
              label={t('landing.offerTrialCTA')}
              className="w-full rounded-full py-3 font-semibold bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-colors"
            />
          </div>

          {/* Founders card */}
          <div className="bg-white border-2 border-emerald-600 rounded-2xl p-6 sm:p-8 shadow-sm relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {t('landing.offerFoundersBadge')}
            </div>
            <h3 className="font-display font-semibold text-gray-900 mb-1">{t('landing.offerFoundersName')}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{t('landing.offerFoundersPrice')}</p>
            <p className="text-gray-500 text-sm mb-6">{t('landing.offerFoundersDesc')}</p>
            <ul className="space-y-3 mb-6">
              {['offerFoundersF1', 'offerFoundersF2', 'offerFoundersF3', 'offerFoundersF4'].map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(152, 60%, 36%)" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M20 6 9 17l-5-5" /></svg>
                  {t(`landing.${key}`)}
                </li>
              ))}
            </ul>
            <LandingCTAButton
              label={t('landing.offerFoundersCTA')}
              className="w-full rounded-full py-3 font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
