import { notFound } from 'next/navigation';
import { locales, type Locale, isValidLocale } from '@/lib/i18n/settings';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

/** Minimal layout – no I18nProvider. App routes get it from (app)/layout. Saves ~150KB on marketing. */
export default function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  if (!isValidLocale(locale)) notFound();
  return <>{children}</>;
}
