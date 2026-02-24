import type { Metadata } from 'next';
import ForDoctorsView from '@/views/ForDoctors';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getT } from '@/lib/i18n/t';
import type { Locale } from '@/lib/i18n/settings';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const t = getT(dict);

  return {
    title: locale === 'de' ? 'Für Ärzt:innen — BeyondRounds' : 'For Doctors — BeyondRounds',
    description: locale === 'de'
      ? 'BeyondRounds wurde speziell für Ärzt:innen entwickelt, um echte Freundschaften aufzubauen.'
      : 'BeyondRounds is designed specifically for physicians to build meaningful friendships.',
    openGraph: {
      title: locale === 'de' ? 'BeyondRounds — Von Ärzt:innen für Ärzt:innen' : 'BeyondRounds — Made for Doctors',
      description: locale === 'de'
        ? 'Nur verifizierte Ärzt:innen. Kleine kuratierte Gruppen. Echte Wochenendtreffen in Berlin.'
        : 'Verified physicians only. Small curated groups. Real weekend meetups in Berlin.',
      images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'Doctors enjoying a relaxed dinner together — BeyondRounds' }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/hero-doctors-friendship.jpg'],
    },
  };
}

export const dynamic = 'force-static';
export const revalidate = 3600;

interface ForDoctorsPageProps {
  params: { locale: string };
}

export default async function ForDoctorsPage({ params }: ForDoctorsPageProps) {
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const t = getT(dict);

  const tt = {
    badge:          t('forDoctors.badge'),
    headline:       t('forDoctors.headline'),
    subheadline:    t('forDoctors.subheadline'),
    challengeTitle: t('forDoctors.challengeTitle'),
    challengeP1:    t('forDoctors.challengeP1'),
    challengeP2:    t('forDoctors.challengeP2'),
    expectTitle:    t('forDoctors.expectTitle'),
    expect1Title:   t('forDoctors.expect1Title'), expect1Desc: t('forDoctors.expect1Desc'),
    expect2Title:   t('forDoctors.expect2Title'), expect2Desc: t('forDoctors.expect2Desc'),
    expect3Title:   t('forDoctors.expect3Title'), expect3Desc: t('forDoctors.expect3Desc'),
    expect4Title:   t('forDoctors.expect4Title'), expect4Desc: t('forDoctors.expect4Desc'),
    expect5Title:   t('forDoctors.expect5Title'), expect5Desc: t('forDoctors.expect5Desc'),
    verifyTitle:    t('forDoctors.verifyTitle'),
    step1Title:     t('forDoctors.step1Title'), step1Desc: t('forDoctors.step1Desc'),
    step2Title:     t('forDoctors.step2Title'), step2Desc: t('forDoctors.step2Desc'),
    step3Title:     t('forDoctors.step3Title'), step3Desc: t('forDoctors.step3Desc'),
    step4Title:     t('forDoctors.step4Title'), step4Desc: t('forDoctors.step4Desc'),
    berlinTitle:    t('forDoctors.berlinTitle'),
    berlinP1:       t('forDoctors.berlinP1'),
    berlinP2:       t('forDoctors.berlinP2'),
    ctaTitle:       t('forDoctors.ctaTitle'),
    ctaSubtitle:    t('forDoctors.ctaSubtitle'),
    ctaButton:      t('forDoctors.ctaButton'),
    imgAlt1:        t('forDoctors.imgAlt1'),
    imgAlt2:        t('forDoctors.imgAlt2'),
    imgAlt3:        t('forDoctors.imgAlt3'),
    imgAlt4:        t('forDoctors.imgAlt4'),
    imgAlt5:        t('forDoctors.imgAlt5'),
    imgAlt6:        t('forDoctors.imgAlt6'),
  };

  return <ForDoctorsView tt={tt} />;
}
