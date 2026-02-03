'use client';

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getStoredLocale, DEFAULT_LOCALE, pathWithLocale, pathWithoutLocale } from "@/lib/locale";

/**
 * Redirects paths without locale to default or saved locale.
 * / → /de or /en, /dashboard → /de/dashboard or /en/dashboard
 */
const RedirectToLocale = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const locale = getStoredLocale() ?? DEFAULT_LOCALE;
    const path = pathWithoutLocale(pathname || '/');
    const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    const hash = typeof window !== 'undefined' ? window.location.hash : "";
    const target = pathWithLocale(path === "/" ? "" : path, locale) + search + hash;
    router.replace(target);
  }, [router, pathname, searchParams]);

  return null;
};

export default RedirectToLocale;
