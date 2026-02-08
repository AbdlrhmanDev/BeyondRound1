import { getDictionary } from '@/lib/i18n/get-dictionary';
import { MarketingHeaderHtml } from '@/components/marketing/MarketingHeaderHtml';
import { FooterSmall } from '@/components/marketing/FooterSmall';
import type { Locale } from '@/lib/i18n/settings';

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

/**
 * Marketing layout – pure server, no client providers.
 * All sections use server-side getT(dict). No useTranslation() needed.
 */
export default async function MarketingLayout({
  children,
  params: { locale },
}: MarketingLayoutProps) {
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeaderHtml dict={dict} locale={locale as Locale} />
      <main>{children}</main>
      <FooterSmall dict={dict} locale={locale as Locale} />
    </div>
  );
}
