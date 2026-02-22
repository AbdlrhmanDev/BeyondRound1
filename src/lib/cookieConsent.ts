// ─── Types ─────────────────────────────────────────────────────────────────────

export type ConsentVersion = 'v1';
export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface ConsentRecord {
  version: ConsentVersion;
  timestamp: string; // ISO 8601
  categories: Record<ConsentCategory, boolean>;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const COOKIE_NAME = 'br_consent';
const LS_KEY = 'br_consent';
const CURRENT_VERSION: ConsentVersion = 'v1';
const MAX_AGE_SECS = 60 * 60 * 24 * 365; // 1 year

// ─── Serialization ─────────────────────────────────────────────────────────────

function deserialize(raw: string): ConsentRecord | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.version === 'string' &&
      typeof parsed.timestamp === 'string' &&
      parsed.categories !== null &&
      typeof parsed.categories === 'object'
    ) {
      return parsed as unknown as ConsentRecord;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ─────────────────────────────────────────────────────────────

/**
 * Persist a consent record to cookie (1-year expiry, SameSite=Lax)
 * and localStorage as a fallback for private-mode browsers.
 */
export function setConsentCookie(record: ConsentRecord): void {
  if (typeof document === 'undefined') return;
  const payload = JSON.stringify(record);
  const encoded = encodeURIComponent(payload);
  document.cookie = `${COOKIE_NAME}=${encoded}; max-age=${MAX_AGE_SECS}; path=/; SameSite=Lax`;
  try {
    localStorage.setItem(LS_KEY, payload);
  } catch {
    // localStorage may be blocked in private/incognito mode — silent fail
  }
}

/**
 * Read the stored consent record.
 * Tries cookie first, falls back to localStorage.
 * Returns null if no valid record is found.
 */
export function getConsentRecord(): ConsentRecord | null {
  if (typeof document === 'undefined') return null;

  // 1. Cookie
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`)
  );
  if (match?.[1]) {
    const record = deserialize(decodeURIComponent(match[1]));
    if (record) return record;
  }

  // 2. localStorage fallback
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return deserialize(raw);
  } catch {
    // ignore
  }

  return null;
}

/**
 * Erase stored consent from both cookie and localStorage.
 * Call this to reset the banner (e.g. after a policy update).
 */
export function clearConsentRecord(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────────

/**
 * Build a versioned consent record with the current timestamp.
 * `necessary` is always true regardless of opts.
 */
export function buildConsentRecord(
  opts: Partial<Record<ConsentCategory, boolean>> = {}
): ConsentRecord {
  return {
    version: CURRENT_VERSION,
    timestamp: new Date().toISOString(),
    categories: {
      necessary: true,
      analytics: opts.analytics ?? false,
      marketing: opts.marketing ?? false,
    },
  };
}

// ─── Guards ─────────────────────────────────────────────────────────────────────

/** Returns true only when the record explicitly allows the given category. */
export function isCategoryAllowed(
  record: ConsentRecord | null,
  category: ConsentCategory
): boolean {
  return record?.categories[category] === true;
}

/**
 * Returns true when the stored consent was created for an older schema version,
 * meaning the user should be re-prompted.
 */
export function isConsentOutdated(record: ConsentRecord | null): boolean {
  return !record || record.version !== CURRENT_VERSION;
}
