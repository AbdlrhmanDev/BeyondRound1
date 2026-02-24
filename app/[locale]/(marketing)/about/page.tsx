import type { Metadata } from 'next';
import AboutView from '@/views/About';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getT } from '@/lib/i18n/t';
import type { Locale } from '@/lib/i18n/settings';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isDE = params.locale === 'de';
  return {
    title: isDE ? 'Über uns — BeyondRounds' : 'About Us — BeyondRounds',
    description: isDE
      ? 'Erfahre mehr über BeyondRounds und unsere Mission, Ärzt:innen dabei zu helfen, echte Freundschaften zu knüpfen.'
      : 'Learn about BeyondRounds and our mission to help physicians build meaningful connections.',
    openGraph: {
      title: isDE ? 'Über BeyondRounds' : 'About BeyondRounds',
      description: isDE
        ? 'Unsere Mission: Ärzt:innen beim Aufbau echter Freundschaften außerhalb des Krankenhauses unterstützen.'
        : 'Learn about our mission to help physicians build meaningful connections beyond the hospital.',
      images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'Doctors enjoying a relaxed dinner together — BeyondRounds' }],
    },
    twitter: { card: 'summary_large_image', images: ['/hero-doctors-friendship.jpg'] },
  };
}

export const dynamic = 'force-static';
export const revalidate = 3600;

interface AboutPageProps {
  params: { locale: string };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const t = getT(dict);

  const tt = {
    badge:       t('about.badge'),
    headline:    t('about.headline'),
    subheadline: t('about.subheadline'),
    missionTitle:t('about.missionTitle'),
    missionP1:   t('about.missionP1'),
    missionBold: t('about.missionBold'),
    missionP2:   t('about.missionP2'),
    whyTitle:    t('about.whyTitle'),
    why1Title:   t('about.why1Title'), why1Desc: t('about.why1Desc'),
    why2Title:   t('about.why2Title'), why2Desc: t('about.why2Desc'),
    why3Title:   t('about.why3Title'), why3Desc: t('about.why3Desc'),
    why4Title:   t('about.why4Title'), why4Desc: t('about.why4Desc'),
    why5Title:   t('about.why5Title'), why5Desc: t('about.why5Desc'),
    expTitle:    t('about.expTitle'),
    expP1:       t('about.expP1'),
    expP2:       t('about.expP2'),
    expP3:       t('about.expP3'),
    trustTitle:  t('about.trustTitle'),
    trust1Title: t('about.trust1Title'), trust1Desc: t('about.trust1Desc'),
    trust2Title: t('about.trust2Title'), trust2Desc: t('about.trust2Desc'),
    trust3Title: t('about.trust3Title'), trust3Desc: t('about.trust3Desc'),
    trust4Title: t('about.trust4Title'), trust4Desc: t('about.trust4Desc'),
    ctaTitle:    t('about.ctaTitle'),
    ctaSubtitle: t('about.ctaSubtitle'),
    ctaButton:   t('about.ctaButton'),
    imgAlt1:     t('about.imgAlt1'),
    imgAlt2:     t('about.imgAlt2'),
    imgAlt3:     t('about.imgAlt3'),
    imgAlt4:     t('about.imgAlt4'),
  };

  return <AboutView tt={tt} />;
}
