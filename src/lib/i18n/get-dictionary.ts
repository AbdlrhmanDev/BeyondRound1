import 'server-only';
import type { Locale } from './settings';

type Dictionary = Record<string, any>;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import('@/locales/en.json').then((m) => m.default),
  de: () => import('@/locales/de.json').then((m) => m.default),
};

// Each namespace is loaded explicitly (dynamic template literals don't work in webpack)
const nsLoaders: Record<string, Record<Locale, () => Promise<Dictionary>>> = {
  landing:    { en: () => import('@/locales/en/landing.json').then((m) => m.default),    de: () => import('@/locales/de/landing.json').then((m) => m.default) },
  about:      { en: () => import('@/locales/en/about.json').then((m) => m.default),      de: () => import('@/locales/de/about.json').then((m) => m.default) },
  pricing:    { en: () => import('@/locales/en/pricing.json').then((m) => m.default),    de: () => import('@/locales/de/pricing.json').then((m) => m.default) },
  forDoctors: { en: () => import('@/locales/en/forDoctors.json').then((m) => m.default), de: () => import('@/locales/de/forDoctors.json').then((m) => m.default) },
  contact:    { en: () => import('@/locales/en/contact.json').then((m) => m.default),    de: () => import('@/locales/de/contact.json').then((m) => m.default) },
  auth:       { en: () => import('@/locales/en/auth.json').then((m) => m.default),       de: () => import('@/locales/de/auth.json').then((m) => m.default) },
  dashboard:  { en: () => import('@/locales/en/dashboard.json').then((m) => m.default),  de: () => import('@/locales/de/dashboard.json').then((m) => m.default) },
  onboarding: { en: () => import('@/locales/en/onboarding.json').then((m) => m.default), de: () => import('@/locales/de/onboarding.json').then((m) => m.default) },
  settings:   { en: () => import('@/locales/en/settings.json').then((m) => m.default),   de: () => import('@/locales/de/settings.json').then((m) => m.default) },
  faq:        { en: () => import('@/locales/en/faq.json').then((m) => m.default),        de: () => import('@/locales/de/faq.json').then((m) => m.default) },
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const nsKeys = Object.keys(nsLoaders);

  const [main, ...nsMaps] = await Promise.all([
    dictionaries[locale](),
    ...nsKeys.map((ns) => nsLoaders[ns][locale]()),
  ]);

  const merged: Dictionary = { ...main };
  nsKeys.forEach((ns, i) => {
    // Namespace values override anything with the same key in the flat file
    merged[ns] = { ...(merged[ns] ?? {}), ...nsMaps[i] };
  });

  return merged;
};
