import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE, getStoredLocale, isLocale } from "@/lib/locale";

/** Load only the initial locale to reduce first-load JS (~25KB saved). */
const getInitialLocale = (): "de" | "en" => {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = getStoredLocale();
  return stored && isLocale(stored) ? stored : DEFAULT_LOCALE;
};

export const initI18n = async () => {
  const lng = getInitialLocale();
  const mod = await import(`@/locales/${lng}.json`);
  await i18n.use(initReactI18next).init({
    resources: { [lng]: { translation: mod.default } },
    lng,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
  });
  i18n.on("languageChanged", (lang) => {
    if (!i18n.hasResourceBundle(lang, "translation")) {
      import(`@/locales/${lang}.json`).then((m) => {
        i18n.addResourceBundle(lang, "translation", m.default);
      });
    }
  });
  return i18n;
};

export default i18n;
