import nextDynamic from 'next/dynamic';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getT } from '@/lib/i18n/t';
import type { Locale } from '@/lib/i18n/settings';

import { LandingModalProvider } from '@/components/landing/LandingModalProvider';
import { LandingProblem } from '@/components/landing/LandingProblem';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingValueProps } from '@/components/landing/LandingValueProps';
import { LandingFoundingMember } from '@/components/landing/LandingFoundingMember';
import { LandingTestimonialsNew } from '@/components/landing/LandingTestimonialsNew';
import { LandingFAQNew } from '@/components/landing/LandingFAQNew';

const LandingHero = nextDynamic(() => import('@/components/landing/LandingHero').then(m => ({ default: m.LandingHero })), { ssr: false });
const LandingWeekendPicker = nextDynamic(() => import('@/components/landing/LandingWeekendPicker').then(m => ({ default: m.LandingWeekendPicker })), { ssr: false });

const StickyMobileCTA = nextDynamic(() => import('@/components/landing/StickyMobileCTA'), { ssr: false });

export const dynamic = 'force-static';
export const revalidate = 60;

interface HomePageProps {
  params: { locale: string };
}

/** Homepage – premium Breeze-inspired landing page (plum/cream/coral). */
export default async function HomePage({ params }: HomePageProps) {
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const t = getT(dict);

  return (
    <LandingModalProvider>
      <div className="min-h-screen bg-[#F6F1EC]">
        {/* A: Hero — full-screen photo with plum overlay + countdown */}
        <LandingHero />

        {/* B: Problem — doctor loneliness */}
        <LandingProblem t={t} />

        {/* C: How it works — 4 steps */}
        <LandingHowItWorks t={t} />

        {/* D: Value props — checkmarks + photo grid */}
        <LandingValueProps t={t} />

        {/* E: Weekend day picker (conversion) */}
        <LandingWeekendPicker />

        {/* F: Founding Member scarcity */}
        <LandingFoundingMember t={t} />

        {/* G: Testimonials */}
        <LandingTestimonialsNew t={t} />

        {/* H: FAQ */}
        <LandingFAQNew t={t} />

        <StickyMobileCTA label="Reserve my spot" />
      </div>
    </LandingModalProvider>
  );
}
