'use client';

/**
 * Minimal language switcher for marketing - no LocaleProvider, no Radix Button.
 * Uses usePathname only. Saves ~40KB (LocaleContext + Button) on landing.
 */
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LanguageLinksProps {
  className?: string;
  /** Use 'overlay' when on dark translucent header (marketing) */
  variant?: 'default' | 'overlay';
  /** Called when any language link is clicked (e.g. to close mobile menu) */
  onLinkClick?: () => void;
}

export function LanguageLinks({ className, variant = 'default', onLinkClick }: LanguageLinksProps) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname?.replace(/^\/(en|de)/, '') || '';
  const currentLocale = pathname?.startsWith('/en') ? 'en' : 'de';

  const locales = ['de', 'en'] as const;

  const isOverlay = variant === 'overlay';

  return (
    <div
      role="tablist"
      aria-label="Language"
      className={cn(
        'inline-flex items-center rounded-lg border p-0.5',
        isOverlay
          ? 'border-white/20 bg-white/5'
          : 'border-border bg-muted/50',
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
              'inline-flex min-h-[32px] min-w-[2.25rem] items-center justify-center rounded-md px-2.5 text-sm font-medium transition-colors',
              isOverlay
                ? isActive
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
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
