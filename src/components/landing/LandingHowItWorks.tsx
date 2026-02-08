interface LandingHowItWorksProps {
  t: (key: string) => string;
}

export function LandingHowItWorks({ t }: LandingHowItWorksProps) {
  const steps = [
    { num: '1', key: 'step1' },
    { num: '2', key: 'step2' },
    { num: '3', key: 'step3' },
    { num: '4', key: 'step4' },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            {t('landing.howTitle')}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('landing.howSubtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {steps.map((step) => (
            <div key={step.key} className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                {step.num}
              </div>
              <h3 className="font-display font-semibold text-gray-900 mb-2">
                {t(`landing.${step.key}Title`)}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {t(`landing.${step.key}Desc`)}
              </p>
            </div>
          ))}
        </div>

        {/* What happens after box */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="font-display font-semibold text-gray-900 mb-2">
            {t('landing.howAfterTitle')}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-lg mx-auto">
            {t('landing.howAfterDesc')}
          </p>
        </div>
      </div>
    </section>
  );
}
