interface LandingWhyFailsProps {
  t: (key: string) => string;
}

export function LandingWhyFails({ t }: LandingWhyFailsProps) {
  const items = ['fail1', 'fail2', 'fail3', 'fail4', 'fail5'];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4 text-center">
          {t('landing.whyFailsTitle')}
        </h2>
        <p className="text-gray-600 text-lg text-center mb-12 max-w-2xl mx-auto">
          {t('landing.whyFailsSubtitle')}
        </p>

        <ul className="space-y-4">
          {items.map((key) => (
            <li key={key} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
              <span className="text-gray-600">{t(`landing.${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
