import { LandingCTAButton } from './LandingCTAButton';

interface LandingTestimonialsNewProps {
  t: (key: string) => string;
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="#F27C5C"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function LandingTestimonialsNew({ t }: LandingTestimonialsNewProps) {
  const testimonials = [
    { quoteKey: 'landing.testimonialQuote1', initials: 'M.L.', labelKey: 'landing.testimonialLabel1' },
    { quoteKey: 'landing.testimonialQuote2', initials: 'A.K.', labelKey: 'landing.testimonialLabel2' },
    { quoteKey: 'landing.testimonialQuote3', initials: 'S.M.', labelKey: 'landing.testimonialLabel3' },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#F7F2EE]">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] tracking-tight mb-12 text-center">
          {t('landing.testimonialTitle')}
        </h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.initials}
              className="bg-white/80 border border-[#E8DED5]/60 rounded-[22px] p-6 sm:p-7 shadow-sm"
            >
              <Stars count={5} />

              <p className="text-[#5E555B] text-sm leading-relaxed mb-5">
                &ldquo;{t(item.quoteKey)}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F27C5C]/15 flex items-center justify-center text-[#F27C5C] text-xs font-semibold">
                  {item.initials}
                </div>
                <p className="text-[#5E555B]/60 text-xs font-medium">{t(item.labelKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA — social proof landed, nudge to convert */}
        <div className="text-center mt-14">
          <LandingCTAButton
            href="/onboarding"
            label={t('landing.testimonialCTA')}
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#F27C5C]/20"
          />
          <p className="text-[#5E555B]/50 text-xs mt-3 tracking-wide">
            {t('landing.testimonialCTANote')}
          </p>
        </div>
      </div>
    </section>
  );
}
