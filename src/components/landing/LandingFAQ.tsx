interface LandingFAQProps {
  t: (key: string) => string;
}

export function LandingFAQ({ t }: LandingFAQProps) {
  const faqs = ['faq1', 'faq2', 'faq3', 'faq4'];

  return (
    <section className="py-20 sm:py-28 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-12 text-center">
          {t('landing.faqTitle')}
        </h2>

        <div className="space-y-3">
          {faqs.map((key) => (
            <details
              key={key}
              className="group bg-white border border-gray-100 rounded-xl shadow-sm"
            >
              <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-gray-900 font-medium text-sm select-none list-none [&::-webkit-details-marker]:hidden">
                <span>{t(`landing.${key}Q`)}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 ml-4 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">
                {t(`landing.${key}A`)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
