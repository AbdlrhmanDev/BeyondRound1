'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import type { Locale } from '@/lib/i18n/settings';

// Sync init with empty resources so I18nextProvider works on first render (avoids hasResourceBundle error)
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {},
    lng: 'de',
    fallbackLng: 'de',
    interpolation: { escapeValue: false },
    keySeparator: '.',
    react: { useSuspense: false },
  });
}

const localeLoaders: Record<Locale, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('@/locales/en.json'),
  de: () => import('@/locales/de.json'),
};

const loadLocale = (locale: Locale) => localeLoaders[locale]();

/** Safe check - hasResourceBundle is only on i18n after init() */
const hasResourceBundle = (lng: string, ns: string) =>
  typeof i18n.hasResourceBundle === 'function' && i18n.hasResourceBundle(lng, ns);

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const initializeI18n = async (locale: Locale, dictionary: Record<string, unknown>) => {
  const resources = { [locale]: { translation: dictionary } };
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: 'de',
      interpolation: { escapeValue: false },
      keySeparator: '.',
    });
  } else {
    i18n.addResourceBundle(locale, 'translation', dictionary, true, true);
    await i18n.changeLanguage(locale);
  }
  return i18n;
};

interface I18nProviderProps {
  children: ReactNode;
  locale: Locale;
  dictionary?: Record<string, unknown>;
}

export function I18nProvider({ children, locale, dictionary }: I18nProviderProps) {
  // Instant ready when dictionary is provided from server (SSR hydration path)
  const [isReady, setIsReady] = useState(() => !!dictionary);
  // Track if we've already applied dictionary to avoid redundant operations on re-renders
  const dictionaryApplied = useRef(false);

  // Apply dictionary synchronously ONCE when provided (avoids hydration mismatch)
  // This runs during render before useEffect, so translations are available immediately
  if (dictionary && !dictionaryApplied.current && i18n.isInitialized && typeof i18n.addResourceBundle === 'function') {
    if (!hasResourceBundle(locale, 'translation')) {
      i18n.addResourceBundle(locale, 'translation', dictionary, true, true);
    }
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    dictionaryApplied.current = true;
  }

  useEffect(() => {
    // If dictionary was provided from server, translations are already applied synchronously
    // No async work needed - skip entirely for instant hydration
    if (dictionary && dictionaryApplied.current) {
      return;
    }

    // Client-only path: load locale asynchronously
    const timeout = setTimeout(() => setIsReady(true), 300); // Fallback: never block > 300ms
    const init = async () => {
      try {
        const mod = await loadLocale(locale);
        const dict = mod.default as Record<string, unknown>;
        await initializeI18n(locale, dict);
        if (i18n.language !== locale) {
          await i18n.changeLanguage(locale);
        }
        setIsReady(true);
      } catch (err) {
        console.error('[I18nProvider] init failed:', err);
        setIsReady(true); // Show app anyway to avoid infinite loading
      } finally {
        clearTimeout(timeout);
      }
    };
    init();
    return () => clearTimeout(timeout);
  }, [locale, dictionary]);

  const setLocale = async (newLocale: Locale) => {
    if (!hasResourceBundle(newLocale, 'translation')) {
      const resources = await loadLocale(newLocale);
      i18n.addResourceBundle(newLocale, 'translation', resources.default);
    }
    await i18n.changeLanguage(newLocale);

    // Update cookie
    document.cookie = `beyondrounds_locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;

    // Redirect to new locale path
    const currentPath = window.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/(de|en)/, '');
    window.location.href = `/${newLocale}${pathWithoutLocale}`;
  };

  // P0 LCP fix: Always render children so HeroImageServer (server) paints in initial HTML.
  // Overlay hides untranslated content until i18n is ready.
  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <I18nextProvider i18n={i18n}>
        {children}
        {!isReady && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
            aria-live="polite"
            aria-label="Loading"
          >
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </I18nextProvider>
    </I18nContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within an I18nProvider');
  }
  return context;
}
