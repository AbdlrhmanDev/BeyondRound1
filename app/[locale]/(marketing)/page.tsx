import { getDictionary } from '@/lib/i18n/get-dictionary';
import { HeroSectionServer } from '@/components/marketing/HeroSectionServer';
import { HowItWorksSectionServer } from '@/components/marketing/HowItWorksSectionServer';
import { CTASectionServer } from '@/components/marketing/CTASectionServer';
import { AboutSectionServer } from '@/components/marketing/AboutSectionServer';
import { FAQSectionServer } from '@/components/marketing/FAQSectionServer';
import { getT } from '@/lib/i18n/t';
import type { Locale } from '@/lib/i18n/settings';

export const dynamic = 'force-static';
export const revalidate = 60;

const faqKeys: [string, string][] = [
  ['faq.q1', 'faq.a1'],
  ['faq.q3', 'faq.a3'],
  ['faq.q4', 'faq.a4'],
  ['faq.q5', 'faq.a5'],
  ['faq.q7', 'faq.a7'],
  ['faq.q8', 'faq.a8'],
  ['faq.q12', 'faq.a12'],
  ['faq.q11', 'faq.a11'],
];

interface HomePageProps {
  params: { locale: string };
}

/** Homepage – Hero in initial HTML (no Suspense) for fastest LCP. */
export default async function HomePage({ params }: HomePageProps) {
  const locale = params.locale as Locale;
  const dict = await getDictionary(locale);
  const t = getT(dict);
  const faqItems = faqKeys.map(([qKey, aKey]) => ({
    question: t(qKey),
    answer: t(aKey),
  }));

  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <HeroSectionServer dict={dict} locale={locale} />
      <HowItWorksSectionServer dict={dict} />
      <FAQSectionServer
        items={faqItems}
        faqLabel={t('common.faq')}
        gotQuestions={t('faq.gotQuestions')}
        subtitle={t('faq.subtitleHome')}
        contactSupportTeam={t('faq.contactSupportTeam')}
        moreFaqLabel={t('faq.viewAll')}
        locale={locale}
      />
      <AboutSectionServer dict={dict} />
      <CTASectionServer dict={dict} locale={locale} />
    </div>
  );
}
