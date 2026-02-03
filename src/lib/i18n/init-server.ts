import 'server-only';
import i18n from 'i18next';
import type { Locale } from './settings';

/**
 * Init i18n on server - use i18next only (no react-i18next) to avoid createContext in RSC.
 * react-i18next uses createContext which fails in Server Components.
 */
let initPromise: Promise<typeof i18n> | null = null;

export async function initI18nServer(locale: Locale, dictionary: Record<string, unknown>) {
  if (i18n.isInitialized) {
    if (!i18n.hasResourceBundle(locale, 'translation')) {
      i18n.addResourceBundle(locale, 'translation', dictionary);
    }
    i18n.changeLanguage(locale);
    return i18n;
  }
  if (!initPromise) {
    initPromise = i18n.init({
      resources: { [locale]: { translation: dictionary } },
      lng: locale,
      fallbackLng: 'de',
      interpolation: { escapeValue: false },
    }).then(() => i18n);
  }
  await initPromise;
  return i18n;
}
