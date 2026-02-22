'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  buildConsentRecord,
  clearConsentRecord,
  ConsentCategory,
  ConsentRecord,
  getConsentRecord,
  isCategoryAllowed,
  isConsentOutdated,
  setConsentCookie,
} from '@/lib/cookieConsent';

// ─── Context type ──────────────────────────────────────────────────────────────

interface ConsentCtx {
  consent: ConsentRecord | null;
  /** True when no valid consent is stored — banner should be visible. */
  showBanner: boolean;
  /** True when the preferences modal is open. */
  showModal: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (cats: Partial<Record<ConsentCategory, boolean>>) => void;
  openModal: () => void;
  closeModal: () => void;
  /** Re-open the banner (e.g. from a footer "Cookie settings" button). */
  openBanner: () => void;
  isAllowed: (cat: ConsentCategory) => boolean;
  /** Erase stored consent and re-show the banner. */
  resetConsent: () => void;
}

const ConsentContext = createContext<ConsentCtx | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  // showBanner starts false to avoid a server/client hydration mismatch.
  // The useEffect below turns it on when no valid consent is found.
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const stored = getConsentRecord();
    if (stored && !isConsentOutdated(stored)) {
      setConsent(stored);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, []);

  const persist = useCallback((record: ConsentRecord) => {
    setConsentCookie(record);
    setConsent(record);
    setShowBanner(false);
    setShowModal(false);
  }, []);

  const acceptAll = useCallback(
    () => persist(buildConsentRecord({ analytics: true, marketing: true })),
    [persist]
  );

  const rejectAll = useCallback(
    () => persist(buildConsentRecord({ analytics: false, marketing: false })),
    [persist]
  );

  const savePreferences = useCallback(
    (cats: Partial<Record<ConsentCategory, boolean>>) =>
      persist(buildConsentRecord(cats)),
    [persist]
  );

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);
  const openBanner = useCallback(() => setShowBanner(true), []);

  const isAllowed = useCallback(
    (cat: ConsentCategory) => isCategoryAllowed(consent, cat),
    [consent]
  );

  const resetConsent = useCallback(() => {
    clearConsentRecord();
    setConsent(null);
    setShowBanner(true);
  }, []);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        showBanner,
        showModal,
        acceptAll,
        rejectAll,
        savePreferences,
        openModal,
        closeModal,
        openBanner,
        isAllowed,
        resetConsent,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useCookieConsent(): ConsentCtx {
  const ctx = useContext(ConsentContext);
  if (!ctx)
    throw new Error('useCookieConsent must be used inside <CookieConsentProvider>');
  return ctx;
}
