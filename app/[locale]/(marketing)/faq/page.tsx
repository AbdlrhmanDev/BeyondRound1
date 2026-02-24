import type { Metadata } from 'next';
import FAQView from '@/views/FAQ';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getT } from '@/lib/i18n/t';
import type { Locale } from '@/lib/i18n/settings';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isDE = params.locale === 'de';
  return {
    title: isDE ? 'FAQ — BeyondRounds' : 'FAQ — BeyondRounds',
    description: isDE
      ? 'Häufig gestellte Fragen zu BeyondRounds — wie das Matching funktioniert, wer beitreten kann und mehr.'
      : 'Frequently asked questions about BeyondRounds — how matching works, who can join, and more.',
    openGraph: {
      title: isDE ? 'BeyondRounds FAQ' : 'BeyondRounds FAQ',
      description: isDE
        ? 'Alles, was du über BeyondRounds wissen möchtest.'
        : 'Everything you want to know about BeyondRounds — how matching works, who can join, and more.',
      images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'Doctors enjoying a relaxed dinner together — BeyondRounds' }],
    },
    twitter: { card: 'summary_large_image', images: ['/hero-doctors-friendship.jpg'] },
  };
}

export const dynamic = 'force-static';
export const revalidate = 3600;

interface FAQPageProps {
  params: { locale: string };
}

export default async function FAQPage({ params }: FAQPageProps) {
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const t = getT(dict);

  const tt = {
    badge:         t('faq.title'),
    headline:      t('faq.subtitle'),
    subheadline:   t('faq.subtitleHome'),
    stillTitle:    t('faq.stillHaveQuestions'),
    stillSubtitle: t('faq.weAreHereToHelp'),
    contactButton: t('faq.contactSupport'),
  };

  const sections = [
    {
      category: t('faq.general'),
      items: [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') },
        { q: t('faq.q3'), a: t('faq.a3') },
      ],
    },
    {
      category: t('faq.matching'),
      items: [
        { q: t('faq.q4'), a: t('faq.a4') },
        { q: t('faq.q5'), a: t('faq.a5') },
        { q: t('faq.q6'), a: t('faq.a6') },
        { q: t('faq.q7'), a: t('faq.a7') },
      ],
    },
    {
      category: t('faq.meetings'),
      items: [
        { q: t('faq.q8'), a: t('faq.a8') },
        { q: t('faq.q9'), a: t('faq.a9') },
      ],
    },
    {
      category: t('faq.pricingCat'),
      items: [
        { q: t('faq.q10'), a: t('faq.a10') },
        { q: t('faq.q11'), a: t('faq.a11') },
        { q: t('faq.q12'), a: t('faq.a12') },
      ],
    },
  ];

  return <FAQView tt={tt} sections={sections} />;
}
