import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";

const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { locale, setLocaleAndNavigate } = useLocale();

  return (
    <div className={cn("flex items-center gap-0.5 rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 p-0.5", className)}>
      {(["de", "en"] as const).map((l) => (
        <Button
          key={l}
          variant={locale === l ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "min-w-[2.25rem] font-medium text-primary-foreground/80 hover:text-primary-foreground",
            locale === l && "bg-primary-foreground/10 text-primary-foreground"
          )}
          onClick={() => setLocaleAndNavigate(l as Locale)}
          aria-label={l === "de" ? "Deutsch" : "English"}
          aria-current={locale === l ? "true" : undefined}
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
