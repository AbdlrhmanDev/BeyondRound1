'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Settings2, Shield, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCookieConsent } from './CookieConsentContext';

// ─── Brand tokens ──────────────────────────────────────────────────────────────

const C = {
  cream: '#F7F2EE',
  plum: '#3A0B22',
  text: '#1A0A12',
  body: '#5E555B',
  coral: '#F27C5C',
  blush: '#F6B4A8',
  border: 'rgba(58,11,34,0.08)',
  borderStrong: 'rgba(58,11,34,0.18)',
} as const;

// ─── Translations ──────────────────────────────────────────────────────────────

const strings = {
  en: {
    alwaysOn: 'Always on',
    prefTitle: 'Cookie Preferences',
    prefClose: 'Close preferences',
    prefIntro: 'Choose which cookies you allow us to use. You can change your mind at any time via the footer link.',
    necessary: 'Necessary',
    necessaryDesc: 'Essential for the site to work — authentication, security, and language preferences. Cannot be disabled.',
    analytics: 'Analytics',
    analyticsDesc: 'Help us understand how BeyondRounds is used so we can improve it. Data is anonymised and never sold.',
    marketing: 'Marketing',
    marketingDesc: 'Allow us to show relevant content and measure the effectiveness of our campaigns on partner platforms.',
    savePrefs: 'Save preferences',
    acceptAll: 'Accept all',
    rejectNonEssential: 'Reject non-essential',
    bannerTitle: 'Your privacy, your choice.',
    bannerBody: 'We use cookies to run the site and (with your permission) improve the experience.',
    privacyPolicy: 'Privacy Policy',
    managePrefs: 'Manage preferences',
    cookieSettings: 'Cookie settings',
  },
  de: {
    alwaysOn: 'Immer aktiv',
    prefTitle: 'Cookie-Einstellungen',
    prefClose: 'Einstellungen schließen',
    prefIntro: 'Wähle, welche Cookies du uns erlaubst zu nutzen. Du kannst deine Entscheidung jederzeit über den Footer-Link ändern.',
    necessary: 'Notwendig',
    necessaryDesc: 'Unverzichtbar für den Betrieb der Seite — Authentifizierung, Sicherheit und Spracheinstellungen. Kann nicht deaktiviert werden.',
    analytics: 'Analyse',
    analyticsDesc: 'Hilf uns zu verstehen, wie BeyondRounds genutzt wird, damit wir es verbessern können. Daten werden anonymisiert und nie verkauft.',
    marketing: 'Marketing',
    marketingDesc: 'Ermöglicht uns, relevante Inhalte anzuzeigen und die Wirksamkeit unserer Kampagnen zu messen.',
    savePrefs: 'Einstellungen speichern',
    acceptAll: 'Alle akzeptieren',
    rejectNonEssential: 'Nicht notwendige ablehnen',
    bannerTitle: 'Deine Privatsphäre, deine Wahl.',
    bannerBody: 'Wir verwenden Cookies, um die Website zu betreiben und (mit deiner Erlaubnis) das Erlebnis zu verbessern.',
    privacyPolicy: 'Datenschutzerklärung',
    managePrefs: 'Einstellungen verwalten',
    cookieSettings: 'Cookie-Einstellungen',
  },
} as const;

type Lang = keyof typeof strings;

function useT() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  return strings[(locale as Lang) in strings ? (locale as Lang) : 'en'];
}

// ─── Focus trap ────────────────────────────────────────────────────────────────

function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const el = ref.current;
    const focusables = Array.from(
      el.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    focusables[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [ref, active]);
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  alwaysOnLabel: string;
  onChange: (val: boolean) => void;
}

function Toggle({ id, label, description, checked, disabled, alwaysOnLabel, onChange }: ToggleProps) {
  const isOn = disabled ? true : checked;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '16px 0' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <label
          htmlFor={id}
          style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2, cursor: disabled ? 'default' : 'pointer' }}
        >
          {label}
        </label>
        <p style={{ margin: 0, fontSize: 12, color: C.body, lineHeight: 1.55 }}>{description}</p>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {disabled && (
          <span style={{ fontSize: 11, fontWeight: 600, color: C.plum, background: C.blush, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
            {alwaysOnLabel}
          </span>
        )}
        <button
          role="switch"
          id={id}
          aria-checked={isOn}
          aria-disabled={disabled}
          aria-label={label}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          style={{
            position: 'relative', flexShrink: 0, width: 44, height: 24, borderRadius: 12,
            border: 'none', padding: 0, background: isOn ? C.plum : '#CEC6CA',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.65 : 1, transition: 'background 0.2s ease',
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute', top: 2, left: isOn ? 'calc(100% - 22px)' : 2,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 4px rgba(26,10,18,0.25)', transition: 'left 0.2s ease',
            }}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Preferences modal ─────────────────────────────────────────────────────────

function PreferencesModal() {
  const { consent, showModal, closeModal, savePreferences, acceptAll, rejectAll } = useCookieConsent();
  const t = useT();

  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const [analytics, setAnalytics] = useState(consent?.categories.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.categories.marketing ?? false);

  useEffect(() => {
    if (showModal) {
      setAnalytics(consent?.categories.analytics ?? false);
      setMarketing(consent?.categories.marketing ?? false);
    }
  }, [showModal, consent]);

  useFocusTrap(modalRef, showModal);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showModal, closeModal]);

  useEffect(() => {
    if (!showModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [showModal]);

  if (!showModal) return null;

  return (
    <div
      role="presentation"
      style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(26,10,18,0.52)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ background: C.cream, borderRadius: 22, width: '100%', maxWidth: 520, maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(26,10,18,0.28)', border: `1px solid ${C.border}` }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: C.coral }} />
            <h2 id={titleId} style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: 18, fontWeight: 700, color: C.plum, margin: 0 }}>
              {t.prefTitle}
            </h2>
          </div>
          <button
            onClick={closeModal}
            aria-label={t.prefClose}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A0B22] rounded-lg p-1 transition-colors hover:bg-[#3A0B22]/5"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} style={{ color: C.body }} />
          </button>
        </div>

        {/* Intro */}
        <div style={{ padding: '12px 24px 0' }}>
          <p style={{ margin: 0, fontSize: 13, color: C.body, lineHeight: 1.6 }}>{t.prefIntro}</p>
        </div>

        {/* Toggles */}
        <div style={{ padding: '0 24px' }}>
          <div style={{ borderBottom: `1px solid ${C.border}` }}>
            <Toggle id="toggle-necessary" label={t.necessary} description={t.necessaryDesc} checked={true} disabled={true} alwaysOnLabel={t.alwaysOn} onChange={() => {}} />
          </div>
          <div style={{ borderBottom: `1px solid ${C.border}` }}>
            <Toggle id="toggle-analytics" label={t.analytics} description={t.analyticsDesc} checked={analytics} alwaysOnLabel={t.alwaysOn} onChange={setAnalytics} />
          </div>
          <div>
            <Toggle id="toggle-marketing" label={t.marketing} description={t.marketingDesc} checked={marketing} alwaysOnLabel={t.alwaysOn} onChange={setMarketing} />
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '16px 24px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            onClick={() => savePreferences({ analytics, marketing })}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A0B22] focus-visible:ring-offset-2 hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ flex: 1, minWidth: 140, background: C.plum, color: C.cream, border: 'none', borderRadius: 12, padding: '12px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            {t.savePrefs}
          </button>
          <button
            onClick={acceptAll}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F27C5C] focus-visible:ring-offset-2 hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ flex: 1, minWidth: 120, background: C.coral, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            {t.acceptAll}
          </button>
          <button
            onClick={rejectAll}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A0B22] focus-visible:ring-offset-2 hover:bg-[#3A0B22]/5 transition-colors"
            style={{ width: '100%', background: 'transparent', color: C.body, border: `1px solid ${C.borderStrong}`, borderRadius: 12, padding: '10px 18px', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
          >
            {t.rejectNonEssential}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Banner ────────────────────────────────────────────────────────────────────

function Banner() {
  const { showBanner, acceptAll, rejectAll, openModal } = useCookieConsent();
  const t = useT();
  const regionId = useId();

  if (!showBanner) return null;

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9990, padding: '0 12px 12px', pointerEvents: 'none' }}>
      <div
        role="region"
        aria-label="Cookie consent"
        aria-labelledby={regionId}
        style={{ margin: '0 auto', maxWidth: 900, background: C.cream, borderRadius: '20px 20px 16px 16px', boxShadow: '0 -2px 24px rgba(26,10,18,0.08), 0 8px 40px rgba(26,10,18,0.12)', border: `1px solid ${C.border}`, padding: '20px 24px', pointerEvents: 'all' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          {/* Text */}
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <p id={regionId} style={{ margin: '0 0 4px', fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: 16, fontWeight: 700, color: C.plum }}>
              {t.bannerTitle}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.body, lineHeight: 1.55 }}>
              {t.bannerBody}{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3A0B22] rounded"
                style={{ color: C.plum, fontWeight: 500 }}
              >
                {t.privacyPolicy}
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={acceptAll}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F27C5C] focus-visible:ring-offset-2 hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {t.acceptAll}
            </button>
            <button
              onClick={rejectAll}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A0B22] focus-visible:ring-offset-2 hover:bg-[#3A0B22]/5 transition-colors"
              style={{ background: 'transparent', color: C.plum, border: `1.5px solid ${C.borderStrong}`, borderRadius: 12, padding: '11px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {t.rejectNonEssential}
            </button>
            <button
              onClick={openModal}
              className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3A0B22] rounded-lg hover:text-[#3A0B22] transition-colors"
              style={{ background: 'transparent', border: 'none', color: C.body, fontWeight: 500, fontSize: 13, cursor: 'pointer', padding: '11px 6px', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
            >
              {t.managePrefs}
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Public exports ────────────────────────────────────────────────────────────

/** Renders both the consent banner and the preferences modal. Mount once in layout. */
export function CookieBanner() {
  return (
    <>
      <Banner />
      <PreferencesModal />
    </>
  );
}

/**
 * A "Cookie settings" button for use in the footer or anywhere else.
 * Opens the preferences modal. Must be rendered inside CookieConsentProvider.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { openModal } = useCookieConsent();
  const t = useT();
  return (
    <button
      onClick={openModal}
      className={className}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Settings2 size={13} />
        {t.cookieSettings}
      </span>
    </button>
  );
}
