import { useEffect } from "react";
import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { isLocale, DEFAULT_LOCALE, setStoredLocale, pathWithLocale, pathWithoutLocale } from "@/lib/locale";
import { useTranslation } from "react-i18next";

/**
 * Wraps all locale-prefixed routes. Validates :locale, sets <html lang>, persists choice, provides LocaleContext.
 * Invalid locale (e.g. /dashboard) redirects to /de/dashboard.
 */
const LocaleLayout = () => {
  const { locale: localeParam } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  const locale = localeParam && isLocale(localeParam) ? localeParam : DEFAULT_LOCALE;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // SEO: hreflang alternates for de/en
  useEffect(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const path = pathWithoutLocale(location.pathname);
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
  }, [locale, location.pathname]);

  useEffect(() => {
    setStoredLocale(locale);
    i18n.changeLanguage(locale);
  }, [locale, i18n]);

  useEffect(() => {
    if (localeParam && !isLocale(localeParam)) {
      const rest = pathWithoutLocale(location.pathname);
      navigate(pathWithLocale(rest === "/" ? "" : rest, DEFAULT_LOCALE), { replace: true });
    }
  }, [localeParam, location.pathname, navigate]);

  if (localeParam && !isLocale(localeParam)) {
    return null;
  }

  return (
    <LocaleProvider>
      <Outlet />
    </LocaleProvider>
  );
};

export default LocaleLayout;
