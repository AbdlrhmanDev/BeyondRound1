'use client';

import { useEffect } from 'react';
import Link from 'next/link';

const messages = {
  de: {
    title: 'Etwas ist schiefgelaufen',
    description: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.',
    tryAgain: 'Erneut versuchen',
    goHome: 'Zur Startseite',
  },
  en: {
    title: 'Something went wrong',
    description: 'We encountered an unexpected error. Please try again.',
    tryAgain: 'Try again',
    goHome: 'Go Home',
  },
} as const;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = 'en'; // Default to English for robustness in error boundary
  const t = messages[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-foreground dark:bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-primary mb-4">
            {t.title}
          </h1>
          <p className="text-primary-foreground/60 mb-4">
            {t.description}
          </p>
          {error.digest && (
            <p className="text-xs text-primary-foreground/40">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground font-semibold h-12 px-6 hover:opacity-90 transition-opacity"
          >
            {t.tryAgain}
          </button>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center rounded-2xl border border-primary-foreground/20 text-primary-foreground font-medium h-12 px-6 hover:bg-primary-foreground/10 transition-colors"
          >
            {t.goHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
