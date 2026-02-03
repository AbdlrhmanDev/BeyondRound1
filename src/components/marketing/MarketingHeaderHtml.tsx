/**
 * Pure HTML/CSS header - NO JavaScript. Zero hydration on home.
 * Uses <details> for mobile menu (native, no React).
 */
import Link from 'next/link';
import { getT } from '@/lib/i18n/t';
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
  pathWithoutLocale?: string;
}

export function MarketingHeaderHtml({ dict, locale, pathWithoutLocale = '' }: MarketingHeaderHtmlProps) {
  const t = getT(dict);
  const path = pathWithoutLocale || '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-3 mt-3 sm:mx-4 sm:mt-4">
        <div className="bg-primary-foreground/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-xl sm:rounded-2xl shadow-lg">
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
                <div className="inline-flex ml-2 rounded-lg border border-white/20 bg-white/5 p-0.5">
                  <Link
                    href={`/de${path === '/' ? '' : path}`}
                    className={`min-h-[32px] min-w-[2.25rem] inline-flex items-center justify-center rounded-md px-2.5 text-sm font-medium ${locale === 'de' ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white'}`}
                    aria-label="Deutsch"
                  >
                    DE
                  </Link>
                  <Link
                    href={`/en${path === '/' ? '' : path}`}
                    className={`min-h-[32px] min-w-[2.25rem] inline-flex items-center justify-center rounded-md px-2.5 text-sm font-medium ${locale === 'en' ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white'}`}
                    aria-label="English"
                  >
                    EN
                  </Link>
                </div>
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

              {/* Mobile: details/summary - zero JS, native. Light nav panel like design. */}
              <details className="md:hidden group/menu relative">
                <summary className="min-h-[44px] min-w-[44px] flex items-center justify-center text-primary-foreground rounded-lg hover:bg-primary-foreground/10 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="group-open/menu:hidden" aria-hidden>
                    ☰
                  </span>
                  <span className="group-open/menu:inline hidden" aria-hidden>
                    ✕
                  </span>
                </summary>
                <div className="md:hidden fixed left-3 right-3 mt-2 bg-black backdrop-blur-xl border border-white/10 rounded-xl shadow-xl p-4 animate-fade-in z-50" style={{ top: 'calc(env(safe-area-inset-top) + 5rem)' }}>
                  <nav className="flex flex-col gap-0.5">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={`/${locale}${link.href}`}
                        className="min-h-[44px] flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/15 active:bg-white/10 rounded-xl font-medium transition-all duration-200"
                      >
                        {t(link.labelKey)}
                      </Link>
                    ))}
                    <Link
                      href={`/${locale}/auth`}
                      prefetch={false}
                      className="min-h-[44px] flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/15 active:bg-white/10 rounded-xl font-medium transition-all duration-200"
                    >
                      {t('common.logIn')}
                    </Link>
                    <div className="pt-4 mt-2">
                      <Link
                        href={`/${locale}/onboarding`}
                        prefetch={false}
                        className="flex min-h-[48px] items-center justify-center rounded-2xl font-semibold bg-gradient-gold text-white shadow-lg shadow-orange-500/30 hover:opacity-95 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      >
                        {t('common.joinNow')}
                      </Link>
                    </div>
                  </nav>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
