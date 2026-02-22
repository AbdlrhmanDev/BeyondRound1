/**
 * Unit tests for src/lib/cookieConsent.ts
 *
 * Runs in jsdom (jest-environment-jsdom), so document.cookie and
 * localStorage are available.
 */

import {
  buildConsentRecord,
  clearConsentRecord,
  ConsentRecord,
  getConsentRecord,
  isCategoryAllowed,
  isConsentOutdated,
  setConsentCookie,
} from './cookieConsent';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Wipe cookies and localStorage between every test. */
function clearAll() {
  document.cookie.split(';').forEach((c) => {
    document.cookie = c
      .replace(/^ +/, '')
      .replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/');
  });
  localStorage.clear();
}

beforeEach(clearAll);

// ─── buildConsentRecord ────────────────────────────────────────────────────────

describe('buildConsentRecord', () => {
  it('always sets necessary=true regardless of opts', () => {
    const r = buildConsentRecord({ analytics: false, marketing: false });
    expect(r.categories.necessary).toBe(true);
  });

  it('reflects analytics and marketing from opts', () => {
    const r = buildConsentRecord({ analytics: true, marketing: true });
    expect(r.categories.analytics).toBe(true);
    expect(r.categories.marketing).toBe(true);
  });

  it('defaults analytics and marketing to false when not provided', () => {
    const r = buildConsentRecord();
    expect(r.categories.analytics).toBe(false);
    expect(r.categories.marketing).toBe(false);
  });

  it('sets version to v1', () => {
    expect(buildConsentRecord().version).toBe('v1');
  });

  it('produces a valid ISO 8601 timestamp', () => {
    const ts = buildConsentRecord().timestamp;
    const date = new Date(ts);
    expect(isNaN(date.getTime())).toBe(false);
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ─── setConsentCookie + getConsentRecord ──────────────────────────────────────

describe('setConsentCookie + getConsentRecord', () => {
  it('round-trips a record through the cookie', () => {
    const record = buildConsentRecord({ analytics: true, marketing: false });
    setConsentCookie(record);

    const got = getConsentRecord();
    expect(got).not.toBeNull();
    expect(got!.version).toBe('v1');
    expect(got!.categories.analytics).toBe(true);
    expect(got!.categories.marketing).toBe(false);
    expect(got!.categories.necessary).toBe(true);
  });

  it('round-trips a record through localStorage (cookie cleared)', () => {
    const record = buildConsentRecord({ analytics: false, marketing: true });
    setConsentCookie(record);

    // Manually expire the cookie so only localStorage remains
    document.cookie = 'br_consent=; max-age=0; path=/;';

    const got = getConsentRecord();
    expect(got).not.toBeNull();
    expect(got!.categories.marketing).toBe(true);
  });

  it('returns null when nothing is stored', () => {
    expect(getConsentRecord()).toBeNull();
  });

  it('returns null for a malformed cookie value', () => {
    document.cookie = 'br_consent=not-valid-json; path=/;';
    expect(getConsentRecord()).toBeNull();
  });

  it('preserves the timestamp from the original record', () => {
    const record = buildConsentRecord({ analytics: true });
    setConsentCookie(record);
    const got = getConsentRecord();
    expect(got!.timestamp).toBe(record.timestamp);
  });
});

// ─── clearConsentRecord ───────────────────────────────────────────────────────

describe('clearConsentRecord', () => {
  it('removes a stored record', () => {
    setConsentCookie(buildConsentRecord({ analytics: true }));
    expect(getConsentRecord()).not.toBeNull();

    clearConsentRecord();
    expect(getConsentRecord()).toBeNull();
  });

  it('is idempotent — does not throw when nothing is stored', () => {
    expect(() => clearConsentRecord()).not.toThrow();
  });
});

// ─── isCategoryAllowed ────────────────────────────────────────────────────────

describe('isCategoryAllowed', () => {
  it('returns false for a null record', () => {
    expect(isCategoryAllowed(null, 'analytics')).toBe(false);
  });

  it('returns true when the category is allowed', () => {
    const r = buildConsentRecord({ analytics: true });
    expect(isCategoryAllowed(r, 'analytics')).toBe(true);
  });

  it('returns false when the category is not allowed', () => {
    const r = buildConsentRecord({ analytics: false });
    expect(isCategoryAllowed(r, 'analytics')).toBe(false);
  });

  it('always returns true for necessary', () => {
    const r = buildConsentRecord();
    expect(isCategoryAllowed(r, 'necessary')).toBe(true);
  });
});

// ─── isConsentOutdated ────────────────────────────────────────────────────────

describe('isConsentOutdated', () => {
  it('returns true for null', () => {
    expect(isConsentOutdated(null)).toBe(true);
  });

  it('returns false for current version (v1)', () => {
    expect(isConsentOutdated(buildConsentRecord())).toBe(false);
  });

  it('returns true for an older version', () => {
    const stale: ConsentRecord = {
      version: 'v0' as 'v1',
      timestamp: new Date().toISOString(),
      categories: { necessary: true, analytics: false, marketing: false },
    };
    expect(isConsentOutdated(stale)).toBe(true);
  });
});
