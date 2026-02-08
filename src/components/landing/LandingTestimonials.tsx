interface LandingTestimonialsProps {
  t: (key: string) => string;
}

export function LandingTestimonials({ t }: LandingTestimonialsProps) {
  const testimonials = ['testimonial1', 'testimonial2', 'testimonial3'];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-12 text-center">
          {t('landing.testimonialsTitle')}
        </h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((key) => (
            <div
              key={key}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-8"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-200 mb-4">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor" />
              </svg>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {t(`landing.${key}Quote`)}
              </p>
              <p className="text-gray-400 text-xs font-medium">
                {t(`landing.${key}Author`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
