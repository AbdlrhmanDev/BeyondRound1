interface LandingGuaranteeProps {
  t: (key: string) => string;
}

export function LandingGuarantee({ t }: LandingGuaranteeProps) {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-8 sm:p-12">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(152, 60%, 36%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-4">
            {t('landing.guaranteeTitle')}
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-lg mx-auto">
            {t('landing.guaranteeDesc')}
          </p>
        </div>
      </div>
    </section>
  );
}
