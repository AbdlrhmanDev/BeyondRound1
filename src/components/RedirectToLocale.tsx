import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getStoredLocale, DEFAULT_LOCALE, pathWithLocale, pathWithoutLocale } from "@/lib/locale";

/**
 * Redirects paths without locale to default or saved locale.
 * / → /de or /en, /dashboard → /de/dashboard or /en/dashboard
 */
const RedirectToLocale = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const locale = getStoredLocale() ?? DEFAULT_LOCALE;
    const path = pathWithoutLocale(location.pathname);
    const search = location.search ?? "";
    const hash = location.hash ?? "";
    const target = pathWithLocale(path === "/" ? "" : path, locale) + search + hash;
    navigate(target, { replace: true });
  }, [navigate, location.pathname, location.search, location.hash]);

  return null;
};

export default RedirectToLocale;
