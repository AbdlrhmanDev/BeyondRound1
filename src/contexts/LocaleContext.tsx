'use client';

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();
  const router = useRouter();

  const value = useMemo(() => {
    // Extract locale from pathname
    const segments = (pathname || '').split('/').filter(Boolean);
    const localeParam = segments[0];
    const localeFromPath = localeParam && isLocale(localeParam)
      ? (localeParam as Locale)
      : getLocaleFromPath(pathname || '');
    const locale = localeFromPath ?? DEFAULT_LOCALE;

    return {
      locale,
      pathWithLocale: (path: string) => pathWithLocaleUtil(path, locale),
      pathWithoutLocale,
      setLocaleAndNavigate: (newLocale: Locale) => {
        setStoredLocaleUtil(newLocale);
        const currentPathWithoutLocale = pathWithoutLocale(pathname || '');
        const newPath = pathWithLocaleUtil(
          currentPathWithoutLocale === "/" ? "" : currentPathWithoutLocale,
          newLocale
        );

        // Update cookie for middleware
        document.cookie = `beyondrounds_locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;

        router.replace(newPath || `/${newLocale}`);
      },
    };
  }, [pathname, router]);

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
