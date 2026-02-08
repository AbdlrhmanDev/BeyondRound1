import { notFound } from 'next/navigation';
import { locales, isValidLocale } from '@/lib/i18n/settings';
import TranslationsProvider from '@/components/TranslationsProvider';
import initTranslations from '@/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

const i18nNamespaces = ['common', 'auth', 'about', 'faq', 'contact', 'pricing', 'landing', 'waitlist', 'dashboard', 'onboarding', 'settings', 'notifications'];

export default async function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  if (!isValidLocale(locale)) notFound();

  const { resources } = await initTranslations(locale, i18nNamespaces);

  return (
    <TranslationsProvider
      locale={locale}
      namespaces={i18nNamespaces}
      resources={resources}
    >
      {children}
    </TranslationsProvider>
  );
}
