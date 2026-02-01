/**
 * Locale utilities for BeyondRounds multilingual routing.
 * Default: German (de). Secondary: English (en).
 * URL pattern: /de/..., /en/...
 */

export const SUPPORTED_LOCALES = ["de", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export const STORAGE_KEY = "beyondrounds_locale";

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

/**
 * Get path without locale prefix. e.g. /de/dashboard -> /dashboard
 */
export function pathWithoutLocale(pathname: string): string {
  const segments = pathname.replace(/^\/+/, "").split("/");
  if (segments.length > 0 && isLocale(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/**
 * Get locale from pathname. e.g. /de/dashboard -> "de"
 * Returns default locale if path has no locale prefix.
 */
export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.replace(/^\/+/, "").split("/");
  if (segments.length > 0 && isLocale(segments[0])) {
    return segments[0] as Locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Build path with locale prefix. e.g. pathWithLocale("/dashboard", "de") -> "/de/dashboard"
 */
export function pathWithLocale(path: string, locale: Locale): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = cleanPath === "/" ? "" : cleanPath;
  return `/${locale}${base}`;
}

export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && isLocale(stored) ? (stored as Locale) : null;
  } catch {
    return null;
  }
}

export function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}
