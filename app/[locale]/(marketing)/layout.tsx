import { headers } from 'next/headers';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { I18nProvider } from '@/providers/I18nProvider';
import { MarketingHeaderHtml } from '@/components/marketing/MarketingHeaderHtml';
import { FooterSmall } from '@/components/marketing/FooterSmall';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import type { Locale } from '@/lib/i18n/settings';

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

/** Marketing: Server layout with I18nProvider for client pages (Pricing, About, FAQ, etc.) */
export default async function MarketingLayout({
  children,
  params: { locale },
}: MarketingLayoutProps) {
  const dict = await getDictionary(locale as Locale);
  const pathWithoutLocale = headers().get('x-pathname') ?? '/';

  return (
    <I18nProvider locale={locale as Locale} dictionary={dict}>
      <div className="min-h-screen bg-background">
        <MarketingHeaderHtml dict={dict} locale={locale as Locale} pathWithoutLocale={pathWithoutLocale} />
        <main>{children}</main>
        <FooterSmall dict={dict} locale={locale as Locale} />
        <PWAInstallPrompt />
      </div>
    </I18nProvider>
  );
}
