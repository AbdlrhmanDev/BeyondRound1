interface LandingForNotForProps {
  t: (key: string) => string;
}

export function LandingForNotFor({ t }: LandingForNotForProps) {
  const forItems = ['for1', 'for2', 'for3', 'for4'];
  const notForItems = ['notFor1', 'notFor2', 'notFor3', 'notFor4'];

  return (
    <section className="py-20 sm:py-28 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-12 text-center">
          {t('landing.forNotForTitle')}
        </h2>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* For */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-display font-semibold text-emerald-600 mb-6">{t('landing.forTitle')}</h3>
            <ul className="space-y-4">
              {forItems.map((key) => (
                <li key={key} className="flex items-start gap-3 text-sm text-gray-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(152, 60%, 36%)" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M20 6 9 17l-5-5" /></svg>
                  {t(`landing.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Not for */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-display font-semibold text-gray-400 mb-6">{t('landing.notForTitle')}</h3>
            <ul className="space-y-4">
              {notForItems.map((key) => (
                <li key={key} className="flex items-start gap-3 text-sm text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-gray-300"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  {t(`landing.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
