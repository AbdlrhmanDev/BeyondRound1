'use client';

import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";

interface LanguageSwitcherProps {
  className?: string;
  /** Use 'overlay' when on dark translucent header */
  variant?: 'default' | 'overlay';
}

const LanguageSwitcher = ({ className, variant = 'default' }: LanguageSwitcherProps) => {
  const { locale, setLocaleAndNavigate } = useLocale();
  const isOverlay = variant === 'overlay';

  return (
    <div
      role="tablist"
      aria-label="Language"
      className={cn(
        "inline-flex items-center rounded-lg border p-0.5",
        isOverlay ? "border-white/20 bg-white/5" : "border-border bg-muted/50",
        className
      )}
    >
      {(["de", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={locale === l}
          aria-label={l === "de" ? "Deutsch" : "English"}
          className={cn(
            "min-h-[32px] min-w-[2.25rem] px-2.5 rounded-md text-sm font-medium transition-colors",
            isOverlay
              ? locale === l
                ? "bg-white/15 text-white shadow-sm border border-white/20"
                : "text-white/80 hover:text-white hover:bg-white/10"
              : locale === l
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
          onClick={() => setLocaleAndNavigate(l as Locale)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
