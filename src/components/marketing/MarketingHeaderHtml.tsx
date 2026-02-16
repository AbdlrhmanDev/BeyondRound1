/**
 * Marketing header — transparent at top, blurred plum on scroll.
 */
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getT } from '@/lib/i18n/t';
import { LanguageLinks } from './LanguageLinks';
import { ScrollHeader } from './ScrollHeader';

const MarketingMobileMenu = dynamic(() => import('./MarketingMobileMenu').then((m) => ({ default: m.MarketingMobileMenu })), {
  ssr: true,
  loading: () => <div className="md:hidden min-w-[44px] min-h-[44px]" aria-hidden />,
});
import type { Locale } from '@/lib/i18n/settings';

const navLinks = [
  { href: '/for-doctors', labelKey: 'common.forDoctors' },
  { href: '/about', labelKey: 'common.about' },
  { href: '/faq', labelKey: 'common.faq' },
  { href: '/contact', labelKey: 'common.contact' },
] as const;

interface MarketingHeaderHtmlProps {
  dict: Record<string, unknown>;
  locale: Locale;
}

export function MarketingHeaderHtml({ dict, locale }: MarketingHeaderHtmlProps) {
  const t = getT(dict);

  return (
    <ScrollHeader>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between min-h-14 sm:h-16">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-1 group min-h-[44px] items-center"
          >
            <span className="font-display font-bold text-xl sm:text-2xl text-white italic tracking-tight">
              Beyond
            </span>
            <span className="font-display font-bold text-xl sm:text-2xl text-[#F6B4A8] italic tracking-tight">
              Rounds
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${locale}${link.href}`}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors duration-200 font-medium text-sm rounded-lg hover:bg-white/10"
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <LanguageLinks variant="overlay" className="ml-2" />
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={`/${locale}/auth`}
              prefetch={false}
              className="inline-flex h-9 items-center justify-center rounded-full px-4 font-medium text-white/70 hover:text-white transition-colors"
            >
              {t('common.logIn')}
            </Link>
            <Link
              href={`/${locale}/onboarding`}
              prefetch={false}
              className="inline-flex h-9 items-center justify-center rounded-full px-5 font-medium bg-[#F27C5C] text-white hover:bg-[#e06a4a] transition-colors shadow-sm"
            >
              Join Berlin
            </Link>
          </div>

          {/* Mobile menu */}
          <MarketingMobileMenu
            locale={locale}
            navLinks={navLinks.map((l) => ({ href: l.href, label: t(l.labelKey) }))}
            logInLabel={t('common.logIn')}
            joinNowLabel="Join Berlin"
            languageLabel={t('common.language')}
          />
        </div>
      </div>
    </ScrollHeader>
  );
}
