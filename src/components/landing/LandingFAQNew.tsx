import { LandingCTAButton } from './LandingCTAButton';

interface LandingFAQNewProps {
  t: (key: string) => string;
}

export function LandingFAQNew({ t }: LandingFAQNewProps) {
  const faqs = [
    { q: t('landing.faq1Q'), a: t('landing.faq1A') },
    { q: t('landing.faq2Q'), a: t('landing.faq2A') },
    { q: t('landing.faq3Q'), a: t('landing.faq3A') },
    { q: t('landing.faq4Q'), a: t('landing.faq4A') },
    { q: t('landing.faq5Q'), a: t('landing.faq5A') },
    { q: t('landing.faq6Q'), a: t('landing.faq6A') },
    { q: t('landing.faq7Q'), a: t('landing.faq7A') },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#F6F1EC]">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] tracking-tight mb-12 text-center">
          {t('landing.faqTitle')}
        </h2>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group bg-white/80 border border-[#E8DED5]/60 rounded-xl shadow-sm"
            >
              <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-[#3A0B22] font-medium text-sm select-none list-none [&::-webkit-details-marker]:hidden">
                <span>{faq.q}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 ml-4 text-[#5E555B]/40 transition-transform duration-200 group-open:rotate-180"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="px-6 pb-5 text-sm text-[#5E555B] leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        {/* CTA — objections handled, final nudge */}
        <div className="text-center mt-14">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <LandingCTAButton
              href="/onboarding"
              label={t('landing.faqCTA')}
              className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#F27C5C]/20"
            />
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-full px-6 py-4 text-sm font-medium text-[#5E555B] hover:text-[#3A0B22] hover:bg-[#3A0B22]/[0.03] transition-all duration-200"
            >
              {t('landing.faqStillQuestions')}
            </a>
          </div>
          <p className="text-[#5E555B]/50 text-xs mt-3 tracking-wide">
            {t('landing.faqCTANote')}
          </p>
        </div>
      </div>
    </section>
  );
}
