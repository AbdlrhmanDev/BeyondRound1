import { LandingCTAButton } from './LandingCTAButton';

interface LandingHowItWorksProps {
  t: (key: string) => string;
}

const stepIcons = [
  (
    <svg key="1" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" />
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    </svg>
  ),
  (
    <svg key="2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  (
    <svg key="3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  (
    <svg key="4" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
];

export function LandingHowItWorks({ t }: LandingHowItWorksProps) {
  const steps = [
    { num: '01', titleKey: 'landing.step1Title', descKey: 'landing.step1Desc' },
    { num: '02', titleKey: 'landing.step2Title', descKey: 'landing.step2Desc' },
    { num: '03', titleKey: 'landing.step3Title', descKey: 'landing.step3Desc' },
    { num: '04', titleKey: 'landing.step4Title', descKey: 'landing.step4Desc' },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-[#F7F2EE]">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] tracking-tight mb-14 text-center">
          {t('landing.howTitle')}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="bg-white/80 border border-[#E8DED5]/60 rounded-[22px] p-6 text-center shadow-sm"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-[#F27C5C]/10 flex items-center justify-center mx-auto mb-4">
                {stepIcons[i]}
              </div>

              {/* Step number */}
              <p className="text-[#F27C5C] text-xs font-semibold tracking-wider uppercase mb-2">
                {t('landing.stepLabel')} {step.num}
              </p>

              {/* Title */}
              <h3 className="font-display font-semibold text-[#3A0B22] text-base mb-2 leading-snug">
                {t(step.titleKey)}
              </h3>

              {/* Description */}
              <p className="text-[#5E555B] text-sm leading-relaxed">
                {t(step.descKey)}
              </p>
            </div>
          ))}
        </div>

        {/* CTA — first conversion nudge */}
        <div className="text-center mt-14">
          <LandingCTAButton
            label={t('landing.howCTA')}
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#F27C5C]/20"
          />
          <p className="text-[#5E555B]/50 text-xs mt-3 tracking-wide">
            {t('landing.howCTANote')}
          </p>
        </div>
      </div>
    </section>
  );
}
