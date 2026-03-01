import { getDictionary } from '@/lib/i18n/get-dictionary';
import { MarketingHeaderHtml } from '@/components/marketing/MarketingHeaderHtml';
import { FooterSmall } from '@/components/marketing/FooterSmall';
import { createClient } from '@/lib/supabase/server';
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* LCP preload: hero image only needed on marketing pages */}
      <link rel="preload" href="/hero-doctors-friendship-mobile.webp" as="image" media="(max-width: 639px)" />
      <link rel="preload" href="/hero-doctors-friendship-card.webp" as="image" media="(min-width: 640px)" />
      <MarketingHeaderHtml dict={dict} locale={locale as Locale} isAuthenticated={!!user} />
      <main>{children}</main>
      <FooterSmall dict={dict} locale={locale as Locale} />
    </div>
  );
}
