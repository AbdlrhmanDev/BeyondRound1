'use client';

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { isLocale, DEFAULT_LOCALE, setStoredLocale, pathWithLocale, pathWithoutLocale } from "@/lib/locale";
import { useTranslation } from "react-i18next";

interface LocaleLayoutProps {
  children: ReactNode;
}

/**
 * Wraps all locale-prefixed routes. Validates locale, sets <html lang>, persists choice, provides LocaleContext.
 * Invalid locale redirects to /de/{path}.
 */
const LocaleLayout = ({ children }: LocaleLayoutProps) => {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();

  const localeParam = params?.locale as string | undefined;
  const locale = localeParam && isLocale(localeParam) ? localeParam : DEFAULT_LOCALE;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // SEO: hreflang alternates for de/en
  useEffect(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const path = pathWithoutLocale(pathname || '/');
    const pathSegment = path === "/" ? "" : path;
    const existing = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existing.forEach((el) => el.remove());
    (["de", "en"] as const).forEach((loc) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = loc;
      link.href = `${base}/${loc}${pathSegment}`;
      document.head.appendChild(link);
    });
    const xDefault = document.createElement("link");
    xDefault.rel = "alternate";
    xDefault.hreflang = "x-default";
    xDefault.href = `${base}/de${pathSegment}`;
    document.head.appendChild(xDefault);
    return () => {
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    };
  }, [locale, pathname]);

  useEffect(() => {
    setStoredLocale(locale);
    i18n.changeLanguage(locale);
  }, [locale, i18n]);

  useEffect(() => {
    if (localeParam && !isLocale(localeParam)) {
      const rest = pathWithoutLocale(pathname || '/');
      router.replace(pathWithLocale(rest === "/" ? "" : rest, DEFAULT_LOCALE));
    }
  }, [localeParam, pathname, router]);

  if (localeParam && !isLocale(localeParam)) {
    return null;
  }

  return (
    <LocaleProvider>
      {children}
    </LocaleProvider>
  );
};

export default LocaleLayout;
