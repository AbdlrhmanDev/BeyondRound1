import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getT } from '@/lib/i18n/t';
import type { Locale } from '@/lib/i18n/settings';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, honest pricing. No hidden fees, no long-term contracts. Start with a single match.',
  openGraph: {
    title: 'BeyondRounds Pricing',
    description: 'Simple, honest pricing. No hidden fees, no long-term contracts. Start with a single match or save with a bundle.',
    images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'Doctors enjoying a relaxed dinner together — BeyondRounds' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-doctors-friendship.jpg'],
  },
};

export default async function PricingPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;

  const [dict, supabase] = await Promise.all([
    getDictionary(locale),
    Promise.resolve(createClient()),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  const t = getT(dict);

  const ctaHref = user
    ? `/${locale}/dashboard`
    : `/${locale}/onboarding`;

  return (
    <div className="pt-16 sm:pt-[60px]">
      <LandingPricing t={t} ctaHref={ctaHref} />
    </div>
  );
}
