'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Settings2, Shield, X } from 'lucide-react';
import { useCookieConsent } from './CookieConsentContext';
import type { ConsentCategory } from '@/lib/cookieConsent';

// ─── Brand tokens (kept close to components that use them) ────────────────────

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
    // Move focus into the modal immediately
    focusables[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
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
  onChange: (val: boolean) => void;
}

function Toggle({ id, label, description, checked, disabled, onChange }: ToggleProps) {
  const isOn = disabled ? true : checked;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        padding: '16px 0',
      }}
    >
      {/* Label + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: C.text,
            marginBottom: 2,
            cursor: disabled ? 'default' : 'pointer',
          }}
        >
          {label}
        </label>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: C.body,
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      </div>

      {/* Toggle control */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {disabled && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.plum,
              background: C.blush,
              padding: '2px 8px',
              borderRadius: 20,
              whiteSpace: 'nowrap',
            }}
          >
            Always on
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
            position: 'relative',
            flexShrink: 0,
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            padding: 0,
            background: isOn ? C.plum : '#CEC6CA',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.65 : 1,
            transition: 'background 0.2s ease',
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 2,
              left: isOn ? 'calc(100% - 22px)' : 2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 4px rgba(26,10,18,0.25)',
              transition: 'left 0.2s ease',
            }}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Preferences modal ─────────────────────────────────────────────────────────

function PreferencesModal() {
  const {
    consent,
    showModal,
    closeModal,
    savePreferences,
    acceptAll,
    rejectAll,
  } = useCookieConsent();

  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const [analytics, setAnalytics] = useState(consent?.categories.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.categories.marketing ?? false);

  // Sync toggle state whenever the modal opens
  useEffect(() => {
    if (showModal) {
      setAnalytics(consent?.categories.analytics ?? false);
      setMarketing(consent?.categories.marketing ?? false);
    }
  }, [showModal, consent]);

  // Focus trap
  useFocusTrap(modalRef, showModal);

  // ESC to close
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showModal, closeModal]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!showModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showModal]);

  if (!showModal) return null;

  return (
    /* Backdrop */
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(26,10,18,0.52)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      {/* Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          background: C.cream,
          borderRadius: 22,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90dvh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(26,10,18,0.28)',
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: C.coral }} />
            <h2
              id={titleId}
              style={{
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                fontSize: 18,
                fontWeight: 700,
                color: C.plum,
                margin: 0,
              }}
            >
              Cookie Preferences
            </h2>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close preferences"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A0B22] rounded-lg p-1 transition-colors hover:bg-[#3A0B22]/5"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} style={{ color: C.body }} />
          </button>
        </div>

        {/* Intro */}
        <div style={{ padding: '12px 24px 0' }}>
          <p style={{ margin: 0, fontSize: 13, color: C.body, lineHeight: 1.6 }}>
            Choose which cookies you allow us to use. You can change your mind at any
            time via the footer link.
          </p>
        </div>

        {/* Toggles */}
        <div style={{ padding: '0 24px' }}>
          <div style={{ borderBottom: `1px solid ${C.border}` }}>
            <Toggle
              id="toggle-necessary"
              label="Necessary"
              description="Essential for the site to work — authentication, security, and language preferences. Cannot be disabled."
              checked={true}
              disabled={true}
              onChange={() => {}}
            />
          </div>
          <div style={{ borderBottom: `1px solid ${C.border}` }}>
            <Toggle
              id="toggle-analytics"
              label="Analytics"
              description="Help us understand how BeyondRounds is used so we can improve it. Data is anonymised and never sold."
              checked={analytics}
              onChange={setAnalytics}
            />
          </div>
          <div>
            <Toggle
              id="toggle-marketing"
              label="Marketing"
              description="Allow us to show relevant content and measure the effectiveness of our campaigns on partner platforms."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '16px 24px 24px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {/* Primary: save custom prefs */}
          <button
            onClick={() => savePreferences({ analytics, marketing })}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A0B22] focus-visible:ring-offset-2 hover:opacity-90 active:scale-[0.98] transition-all"
            style={{
              flex: 1,
              minWidth: 140,
              background: C.plum,
              color: C.cream,
              border: 'none',
              borderRadius: 12,
              padding: '12px 18px',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Save preferences
          </button>

          {/* Secondary: accept all */}
          <button
            onClick={acceptAll}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F27C5C] focus-visible:ring-offset-2 hover:opacity-90 active:scale-[0.98] transition-all"
            style={{
              flex: 1,
              minWidth: 120,
              background: C.coral,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 18px',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Accept all
          </button>

          {/* Tertiary: reject all */}
          <button
            onClick={rejectAll}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A0B22] focus-visible:ring-offset-2 hover:bg-[#3A0B22]/5 transition-colors"
            style={{
              width: '100%',
              background: 'transparent',
              color: C.body,
              border: `1px solid ${C.borderStrong}`,
              borderRadius: 12,
              padding: '10px 18px',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Reject non-essential
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Banner ────────────────────────────────────────────────────────────────────

function Banner() {
  const { showBanner, acceptAll, rejectAll, openModal } = useCookieConsent();
  const regionId = useId();

  if (!showBanner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9990,
        padding: '0 12px 12px',
        pointerEvents: 'none',
      }}
    >
      <div
        role="region"
        aria-label="Cookie consent"
        aria-labelledby={regionId}
        style={{
          margin: '0 auto',
          maxWidth: 900,
          background: C.cream,
          borderRadius: '20px 20px 16px 16px',
          boxShadow:
            '0 -2px 24px rgba(26,10,18,0.08), 0 8px 40px rgba(26,10,18,0.12)',
          border: `1px solid ${C.border}`,
          padding: '20px 24px',
          pointerEvents: 'all',
        }}
      >
        {/* Two-column layout: text | actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {/* Text */}
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <p
              id={regionId}
              style={{
                margin: '0 0 4px',
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                fontSize: 16,
                fontWeight: 700,
                color: C.plum,
              }}
            >
              Your privacy, your choice.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.body, lineHeight: 1.55 }}>
              We use cookies to run the site and (with your permission) improve the
              experience.{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3A0B22] rounded"
                style={{ color: C.plum, fontWeight: 500 }}
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}
          >
            {/* Accept all — coral CTA */}
            <button
              onClick={acceptAll}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F27C5C] focus-visible:ring-offset-2 hover:opacity-90 active:scale-[0.98] transition-all"
              style={{
                background: C.coral,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '11px 20px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Accept all
            </button>

            {/* Reject — plum outline */}
            <button
              onClick={rejectAll}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A0B22] focus-visible:ring-offset-2 hover:bg-[#3A0B22]/5 transition-colors"
              style={{
                background: 'transparent',
                color: C.plum,
                border: `1.5px solid ${C.borderStrong}`,
                borderRadius: 12,
                padding: '11px 20px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Reject non-essential
            </button>

            {/* Manage — ghost */}
            <button
              onClick={openModal}
              className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3A0B22] rounded-lg hover:text-[#3A0B22] transition-colors"
              style={{
                background: 'transparent',
                border: 'none',
                color: C.body,
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                padding: '11px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              Manage preferences
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
  return (
    <button
      onClick={openModal}
      className={className}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        <Settings2 size={13} />
        Cookie settings
      </span>
    </button>
  );
}
