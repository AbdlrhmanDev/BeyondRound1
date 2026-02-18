/**
 * Marketing header — premium plum gradient capsule with glass depth.
 * Links: centered nav with clear hierarchy.
 * CTA: single coral pill (Join Berlin or Dashboard).
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
  isAuthenticated?: boolean;
}

export function MarketingHeaderHtml({ dict, locale, isAuthenticated = false }: MarketingHeaderHtmlProps) {
  const t = getT(dict);

  return (
    <ScrollHeader>
      <div className="container mx-auto px-5 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-[60px]">
          {/* Logo — left */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-1.5 group min-h-[44px] shrink-0"
          >
            <span className="font-display font-bold text-xl sm:text-[1.375rem] text-white italic tracking-tight transition-opacity duration-200 group-hover:opacity-90">
              Beyond
            </span>
            <span className="font-display font-bold text-xl sm:text-[1.375rem] text-[#F6B4A8] italic tracking-tight transition-opacity duration-200 group-hover:opacity-90">
              Rounds
            </span>
          </Link>

          {/* Desktop nav — center */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${locale}${link.href}`}
                className="relative px-3.5 py-2 text-white/80 hover:text-white font-medium text-[0.8125rem] tracking-[0.01em] rounded-lg hover:bg-white/[0.08] active:bg-white/[0.12] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          {/* Right cluster — language + auth + CTA */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageLinks variant="overlay" />

            {isAuthenticated ? (
              <Link
                href={`/${locale}/dashboard`}
                prefetch={false}
                className="inline-flex h-9 items-center justify-center rounded-full px-5 font-semibold text-[0.8125rem] tracking-[0.01em] bg-[#F27C5C] text-white hover:bg-[#e8694d] active:bg-[#d8603f] transition-all duration-200 shadow-[0_2px_8px_rgba(242,124,92,0.3)] hover:shadow-[0_4px_12px_rgba(242,124,92,0.35)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F27C5C]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3A0B22]"
                aria-label="Go to your dashboard"
              >
                {t('common.dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href={`/${locale}/auth`}
                  prefetch={false}
                  className="inline-flex h-9 items-center justify-center rounded-full px-4 font-medium text-[0.8125rem] tracking-[0.01em] text-white/75 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8]/50"
                >
                  {t('common.logIn')}
                </Link>
                <Link
                  href={`/${locale}/onboarding`}
                  prefetch={false}
                  className="inline-flex h-9 items-center justify-center rounded-full px-5 font-semibold text-[0.8125rem] tracking-[0.01em] bg-[#F27C5C] text-white hover:bg-[#e8694d] active:bg-[#d8603f] transition-all duration-200 shadow-[0_2px_8px_rgba(242,124,92,0.3)] hover:shadow-[0_4px_12px_rgba(242,124,92,0.35)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F27C5C]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3A0B22]"
                >
                  Join Berlin
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <MarketingMobileMenu
            locale={locale}
            navLinks={navLinks.map((l) => ({ href: l.href, label: t(l.labelKey) }))}
            logInLabel={t('common.logIn')}
            joinNowLabel="Join Berlin"
            languageLabel={t('common.language')}
            isAuthenticated={isAuthenticated}
            dashboardLabel={t('common.dashboard')}
            logOutLabel={t('common.signOut')}
          />
        </div>
      </div>
    </ScrollHeader>
  );
}
