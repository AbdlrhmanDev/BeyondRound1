'use client';

/**
 * Minimal language switcher for marketing - no LocaleProvider, no Radix Button.
 * Uses usePathname only. Saves ~40KB (LocaleContext + Button) on landing.
 *
 * Variants:
 * - overlay: plum capsule header (white text on dark)
 * - mobile-menu: cream card menu (plum text on light)
 * - ghost: transparent, used in app chrome
 * - default: bordered pill for generic surfaces
 */
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LanguageLinksProps {
  className?: string;
  variant?: 'default' | 'overlay' | 'ghost' | 'mobile-menu';
  onLinkClick?: () => void;
}

export function LanguageLinks({ className, variant = 'default', onLinkClick }: LanguageLinksProps) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname?.replace(/^\/(en|de)/, '') || '';
  const currentLocale = pathname?.startsWith('/en') ? 'en' : 'de';

  const locales = ['de', 'en'] as const;

  const isOverlay = variant === 'overlay';
  const isGhost = variant === 'ghost';
  const isMobileMenu = variant === 'mobile-menu';

  return (
    <div
      role="tablist"
      aria-label="Language"
      className={cn(
        'inline-flex items-center rounded-lg p-0.5',
        isOverlay
          ? 'border border-white/[0.12] bg-white/[0.06]'
          : isMobileMenu
            ? 'border border-[#E8DED5]/60 bg-[#F6F1EC]/60'
            : isGhost
              ? 'border-transparent bg-transparent'
              : 'border border-border bg-muted/50',
        className
      )}
    >
      {locales.map((locale) => {
        const href = `/${locale}${pathWithoutLocale}`;
        const isActive = currentLocale === locale;
        return (
          <Link
            key={locale}
            href={href}
            role="tab"
            aria-selected={isActive}
            aria-label={locale === 'de' ? 'Deutsch' : 'English'}
            onClick={onLinkClick}
            className={cn(
              'inline-flex min-h-[30px] min-w-[2.125rem] items-center justify-center rounded-md px-2.5 text-[0.8125rem] font-medium transition-all duration-200',
              isOverlay
                ? isActive
                  ? 'bg-white/[0.15] text-white font-semibold border border-white/20'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/[0.08]'
                : isMobileMenu
                  ? isActive
                    ? 'bg-[#3A0B22]/[0.06] text-[#3A0B22] font-semibold border border-[#3A0B22]/10'
                    : 'text-[#5E555B] hover:text-[#3A0B22] hover:bg-[#3A0B22]/[0.04]'
                  : isGhost
                    ? isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    : isActive
                      ? 'bg-background text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
            aria-current={isActive ? 'true' : undefined}
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
