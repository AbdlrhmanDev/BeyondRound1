/**
 * Cookie-based storage for Supabase Auth - enables cross-subdomain sessions
 * Cookies use Domain=.beyondrounds.app, Secure, SameSite=None
 *
 * Note: HttpOnly cannot be set from client JS. For HttpOnly cookies, use a
 * server-side auth proxy (e.g. on whitelist) that sets cookies via Set-Cookie.
 *
 * Only used when VITE_USE_COOKIE_STORAGE=true and on production subdomains
 */

import { COOKIE_DOMAIN, isProductionSubdomain } from "./domains";

const AUTH_KEY = "sb-auth-token";
const COOKIE_OPTIONS = `; Domain=${COOKIE_DOMAIN}; Path=/; Secure; SameSite=None; Max-Age=31536000`;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}${COOKIE_OPTIONS}`;
}

function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Domain=${COOKIE_DOMAIN}; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Supabase-compatible storage adapter using cookies for cross-subdomain auth
 * Use when deploying to whitelist.beyondrounds.app for shared session
 */
export function createCookieStorage(): Storage {
  return {
    getItem(key: string): string | null {
      const stored = getCookie(AUTH_KEY);
      if (!stored) return null;
      try {
        const data = JSON.parse(stored) as Record<string, string>;
        return data[key] ?? null;
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      const stored = getCookie(AUTH_KEY);
      let data: Record<string, string> = {};
      try {
        if (stored) data = JSON.parse(stored);
      } catch {
        /* ignore */
      }
      data[key] = value;
      setCookie(AUTH_KEY, JSON.stringify(data));
    },
    removeItem(key: string): void {
      const stored = getCookie(AUTH_KEY);
      if (!stored) return;
      try {
        const data = JSON.parse(stored) as Record<string, string>;
        delete data[key];
        if (Object.keys(data).length === 0) {
          removeCookie(AUTH_KEY);
        } else {
          setCookie(AUTH_KEY, JSON.stringify(data));
        }
      } catch {
        removeCookie(AUTH_KEY);
      }
    },
    key(index: number): string | null {
      const stored = getCookie(AUTH_KEY);
      if (!stored) return null;
      try {
        const keys = Object.keys(JSON.parse(stored));
        return keys[index] ?? null;
      } catch {
        return null;
      }
    },
    get length(): number {
      const stored = getCookie(AUTH_KEY);
      if (!stored) return 0;
      try {
        return Object.keys(JSON.parse(stored)).length;
      } catch {
        return 0;
      }
    },
    clear(): void {
      removeCookie(AUTH_KEY);
    },
  };
}

/** Whether to use cookie storage (cross-subdomain) vs localStorage */
export function shouldUseCookieStorage(): boolean {
  const envFlag = import.meta.env.VITE_USE_COOKIE_STORAGE === "true";
  return envFlag && isProductionSubdomain();
}
