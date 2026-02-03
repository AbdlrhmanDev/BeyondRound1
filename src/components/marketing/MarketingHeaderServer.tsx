/**
 * Server wrapper: fetches dict, passes translated strings to client header.
 * Client header deferred (dynamic + IdleDefer) - reduces TBT for Lighthouse 90+.
 */
import dynamic from 'next/dynamic';
import { getT } from '@/lib/i18n/t';
import { DeferredHeader } from './DeferredHeader';
import type { Locale } from '@/lib/i18n/settings';

const MarketingHeaderClient = dynamic(
  () => import('./MarketingHeaderClient').then((m) => ({ default: m.MarketingHeaderClient })),
  { ssr: false }
);

const navLinks = [
  { href: '/for-doctors', labelKey: 'common.forDoctors' },
  { href: '/about', labelKey: 'common.about' },
  { href: '/faq', labelKey: 'common.faq' },
  { href: '/contact', labelKey: 'common.contact' },
  { href: '/pricing', labelKey: 'common.pricing' },
] as const;

interface MarketingHeaderServerProps {
  dict: Record<string, unknown>;
  locale: Locale;
}

export function MarketingHeaderServer({ dict, locale }: MarketingHeaderServerProps) {
  const t = getT(dict);
  const translatedNavLinks = navLinks.map((l) => ({ href: l.href, label: t(l.labelKey) }));

  return (
    <DeferredHeader>
      <MarketingHeaderClient
        locale={locale}
        navLinks={translatedNavLinks}
        logInLabel={t('common.logIn')}
        joinNowLabel={t('common.joinNow')}
        brandLabel={t('common.brand')}
      />
    </DeferredHeader>
  );
}
