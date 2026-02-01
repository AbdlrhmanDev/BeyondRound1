import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocaleFromPath, pathWithLocale } from "@/lib/locale";

const STORAGE_KEY = "cookie_consent_accepted";

export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const locale = getLocaleFromPath(location.pathname);
  const privacyPath = pathWithLocale("/privacy", locale);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (accepted !== "true") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 md:p-5 rounded-2xl bg-card border border-border shadow-lg shadow-black/10 dark:shadow-black/30">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("cookieConsent.message")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("cookieConsent.agree")}{" "}
                <Link
                  to={privacyPath}
                  className="underline hover:text-primary transition-colors"
                >
                  {t("cookieConsent.privacyPolicy")}
                </Link>
              </p>
            </div>
          </div>
          <Button
            onClick={accept}
            className="w-full sm:w-auto shrink-0 rounded-xl"
          >
            {t("common.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
