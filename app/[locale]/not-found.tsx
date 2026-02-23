'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const messages = {
  de: {
    title: 'Seite nicht gefunden',
    description: 'Die Seite, die du suchst, existiert nicht oder wurde verschoben.',
    goHome: 'Zur Startseite',
    goBack: 'Zurück',
  },
  en: {
    title: 'Page Not Found',
    description: "The page you're looking for doesn't exist or has been moved.",
    goHome: 'Go Home',
    goBack: 'Go Back',
  },
} as const;

export default function NotFound() {
  // Avoid usePathname() — it requires Router context which may be null
  // when this component is rendered inside Next.js's internal ErrorBoundary.
  const [locale, setLocale] = useState<'de' | 'en'>('de');

  useEffect(() => {
    setLocale(window.location.pathname.startsWith('/en') ? 'en' : 'de');
  }, []);

  const t = messages[locale];

  return (
    <div className="min-h-screen bg-foreground dark:bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-display font-bold text-gradient-gold mb-4">
          404
        </h1>
        <h2 className="text-2xl font-display font-semibold text-primary-foreground mb-2">
          {t.title}
        </h2>
        <p className="text-primary-foreground/60 mb-8">
          {t.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground font-semibold h-12 px-6 hover:opacity-90 transition-opacity"
          >
            {t.goHome}
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-2xl border border-primary-foreground/20 text-primary-foreground font-medium h-12 px-6 hover:bg-primary-foreground/10 transition-colors"
          >
            {t.goBack}
          </button>
        </div>
      </div>
    </div>
  );
}
