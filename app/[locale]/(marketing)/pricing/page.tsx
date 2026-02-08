import type { Metadata } from 'next';
import PricingPageContent from '@/views/Pricing';
import TranslationsProvider from '@/components/TranslationsProvider';
import initTranslations from '@/i18n';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'BeyondRounds pricing plans for physicians.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

const i18nNamespaces = ['pricing'];

export default async function PricingPage({ params: { locale } }: { params: { locale: string } }) {
  const { resources } = await initTranslations(locale, i18nNamespaces);

  return (
    <TranslationsProvider
      locale={locale}
      namespaces={i18nNamespaces}
      resources={resources}
    >
      <PricingPageContent />
    </TranslationsProvider>
  );
}
