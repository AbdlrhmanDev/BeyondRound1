interface LandingMechanismProps {
  t: (key: string) => string;
}

export function LandingMechanism({ t }: LandingMechanismProps) {
  const bullets = ['mech1', 'mech2', 'mech3', 'mech4', 'mech5', 'mech6'];

  return (
    <section className="py-20 sm:py-28 bg-emerald-50/50">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            {t('landing.mechanismTitle')}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('landing.mechanismSubtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {bullets.map((key) => (
            <div
              key={key}
              className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(152, 60%, 36%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="text-gray-700 text-sm">{t(`landing.${key}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
