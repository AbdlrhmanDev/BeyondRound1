'use client';

/**
 * Only loads I18nProvider (i18next ~80KB) for app routes.
 * Marketing pages use server-rendered dict - no i18n on client.
 * Note: Static import used for dev stability (dynamic caused chunk resolution errors).
 */
import { usePathname } from 'next/navigation';
import { I18nProvider } from '@/providers/I18nProvider';
import type { Locale } from '@/lib/i18n/settings';
import type { ReactNode } from 'react';

const MARKETING_PATHS = [
  '',
  '/about',
  '/contact',
  '/faq',
  '/for-doctors',
  '/learn-more',
  '/pricing',
  '/privacy',
  '/terms',
  '/waitlist',
];

function isMarketingRoute(pathname: string | null): boolean {
  if (!pathname) return true; // default to marketing for safety
  const withoutLocale = pathname.replace(/^\/(de|en)/, '') || '/';
  const path = withoutLocale === '/' ? '' : withoutLocale;
  return MARKETING_PATHS.includes(path);
}

interface ConditionalI18nProviderProps {
  children: ReactNode;
  locale: Locale;
  dictionary: Record<string, unknown>;
}

export function ConditionalI18nProvider({
  children,
  locale,
  dictionary,
}: ConditionalI18nProviderProps) {
  const pathname = usePathname();
  const isMarketing = isMarketingRoute(pathname);

  if (isMarketing) {
    return <>{children}</>;
  }

  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      {children}
    </I18nProvider>
  );
}
