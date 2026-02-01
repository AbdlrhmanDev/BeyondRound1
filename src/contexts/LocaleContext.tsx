import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import type { Locale } from "@/lib/locale";
import {
  pathWithLocale as pathWithLocaleUtil,
  pathWithoutLocale,
  getLocaleFromPath,
  setStoredLocale as setStoredLocaleUtil,
  DEFAULT_LOCALE,
  isLocale,
} from "@/lib/locale";

interface LocaleContextValue {
  locale: Locale;
  pathWithLocale: (path: string) => string;
  pathWithoutLocale: (pathname: string) => string;
  setLocaleAndNavigate: (newLocale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ locale: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const value = useMemo(() => {
    const localeFromPath = params.locale && isLocale(params.locale) ? (params.locale as Locale) : getLocaleFromPath(location.pathname);
    const locale = localeFromPath ?? DEFAULT_LOCALE;

    return {
      locale,
      pathWithLocale: (path: string) => pathWithLocaleUtil(path, locale),
      pathWithoutLocale,
      setLocaleAndNavigate: (newLocale: Locale) => {
        setStoredLocaleUtil(newLocale);
        const currentPathWithoutLocale = pathWithoutLocale(location.pathname);
        const newPath = pathWithLocaleUtil(currentPathWithoutLocale === "/" ? "" : currentPathWithoutLocale, newLocale);
        navigate(newPath || `/${newLocale}`, { replace: true });
      },
    };
  }, [params.locale, location.pathname, location.search, navigate]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider (inside a :locale route)");
  }
  return ctx;
}

/** Use locale when inside locale routes; returns null when not (e.g. redirect page). */
export function useLocaleOptional(): LocaleContextValue | null {
  return useContext(LocaleContext);
}
