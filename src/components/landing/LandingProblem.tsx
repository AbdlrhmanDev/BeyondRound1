interface LandingProblemProps {
  t: (key: string) => string;
}

export function LandingProblem({ t }: LandingProblemProps) {
  const cards = [
    { key: 'problem1', icon: '01' },
    { key: 'problem2', icon: '02' },
    { key: 'problem3', icon: '03' },
  ];

  return (
    <section className="py-20 sm:py-28 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            {t('landing.problemTitle')}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('landing.problemSubtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.key}
              className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <span className="text-emerald-600 text-sm font-bold">{card.icon}</span>
              </div>
              <h3 className="font-display font-semibold text-gray-900 mb-2">
                {t(`landing.${card.key}Title`)}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {t(`landing.${card.key}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
