import nextDynamic from 'next/dynamic';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getT } from '@/lib/i18n/t';
import type { Locale } from '@/lib/i18n/settings';

import { LandingModalProvider } from '@/components/landing/LandingModalProvider';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingProblem } from '@/components/landing/LandingProblem';
import { LandingWhyFails } from '@/components/landing/LandingWhyFails';
import { LandingMechanism } from '@/components/landing/LandingMechanism';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingOffer } from '@/components/landing/LandingOffer';
import { LandingGuarantee } from '@/components/landing/LandingGuarantee';
import { LandingForNotFor } from '@/components/landing/LandingForNotFor';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingFinalCTA } from '@/components/landing/LandingFinalCTA';

const StickyMobileCTA = nextDynamic(() => import('@/components/landing/StickyMobileCTA'), { ssr: false });

export const dynamic = 'force-static';
export const revalidate = 60;

interface HomePageProps {
  params: { locale: string };
}

/** Homepage – 11-section landing page with white/green theme. */
export default async function HomePage({ params }: HomePageProps) {
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const t = getT(dict);

  return (
    <LandingModalProvider>
      <div className="min-h-screen bg-white">
        <LandingHero t={t} />
        <LandingProblem t={t} />
        <LandingWhyFails t={t} />
        <LandingMechanism t={t} />
        <LandingHowItWorks t={t} />
        <LandingOffer t={t} />
        <LandingGuarantee t={t} />
        <LandingForNotFor t={t} />
        <LandingTestimonials t={t} />
        <LandingFAQ t={t} />
        <LandingFinalCTA t={t} />
        <StickyMobileCTA label={t('landing.heroCTA')} />
      </div>
    </LandingModalProvider>
  );
}
