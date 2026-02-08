/**
 * Marketing header - server-rendered with client mobile menu.
 * Mobile menu: backdrop, close on link/outside click, language switcher.
 * MarketingMobileMenu is dynamic-imported to keep hero page JS minimal.
 */
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getT } from '@/lib/i18n/t';
import { LanguageLinks } from './LanguageLinks';

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
  { href: '/pricing', labelKey: 'common.pricing' },
] as const;

interface MarketingHeaderHtmlProps {
  dict: Record<string, unknown>;
  locale: Locale;
}

export function MarketingHeaderHtml({ dict, locale }: MarketingHeaderHtmlProps) {
  const t = getT(dict);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-3 mt-3 sm:mx-4 sm:mt-4">
        <div className="bg-foreground/95 border border-primary-foreground/10 rounded-xl sm:rounded-2xl shadow-lg">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between min-h-14 sm:h-16">
              <Link
                href={`/${locale}`}
                className="flex items-center gap-2 sm:gap-3 group min-h-[44px] items-center"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300 shrink-0">
                  <span className="text-primary-foreground text-xs">✦</span>
                </div>
                <span className="font-display font-bold text-base sm:text-xl text-primary-foreground tracking-tight truncate">
                  {t('common.brand')}
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={`/${locale}${link.href}`}
                    className="px-4 py-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200 font-medium text-sm rounded-lg hover:bg-primary-foreground/5"
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
                <LanguageLinks variant="overlay" className="ml-2" />
              </nav>

              <div className="hidden md:flex items-center gap-3">
                <Link
                  href={`/${locale}/auth`}
                  prefetch={false}
                  className="inline-flex h-9 items-center justify-center rounded-2xl px-3 font-medium text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                >
                  {t('common.logIn')}
                </Link>
                <Link
                  href={`/${locale}/onboarding`}
                  prefetch={false}
                  className="inline-flex h-9 items-center justify-center rounded-2xl px-4 font-medium bg-gradient-gold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {t('common.joinNow')}
                </Link>
              </div>

              {/* Mobile: client menu with backdrop, close on click, language inside */}
              <MarketingMobileMenu
                locale={locale}
                navLinks={navLinks.map((l) => ({ href: l.href, label: t(l.labelKey) }))}
                logInLabel={t('common.logIn')}
                joinNowLabel={t('common.joinNow')}
                languageLabel={t('common.language')}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
