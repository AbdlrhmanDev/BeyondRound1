import { headers } from 'next/headers';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { MarketingHeaderHtml } from '@/components/marketing/MarketingHeaderHtml';
import { FooterServer } from '@/components/marketing/FooterServer';
import type { Locale } from '@/lib/i18n/settings';

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

/** Marketing: 100% Server. Zero client JS. No hydration. */
export default async function MarketingLayout({
  children,
  params: { locale },
}: MarketingLayoutProps) {
  const dict = await getDictionary(locale as Locale);
  const pathWithoutLocale = headers().get('x-pathname') ?? '/';

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeaderHtml dict={dict} locale={locale as Locale} pathWithoutLocale={pathWithoutLocale} />
      <main>{children}</main>
      <FooterServer dict={dict} locale={locale as Locale} />
    </div>
  );
}
