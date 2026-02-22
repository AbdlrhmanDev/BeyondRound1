'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PushPermission = 'default' | 'granted' | 'denied';

export interface PushNotificationState {
  /** Browser supports Web Push API */
  isSupported:  boolean;
  /** True on iOS — push only works when installed as PWA (Add to Home Screen) */
  isIOS:        boolean;
  /** True if running as installed PWA (standalone display mode) */
  isStandalone: boolean;
  /** Current Notification.permission */
  permission:   PushPermission;
  /** User has an active subscription saved on the server */
  isSubscribed: boolean;
  /** Subscribing / unsubscribing in progress */
  isLoading:    boolean;
  /** Last error message */
  error:        string | null;
}

export interface UsePushNotificationsReturn extends PushNotificationState {
  /** Request permission and save subscription to server */
  subscribe:   () => Promise<boolean>;
  /** Remove subscription from server and browser */
  unsubscribe: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert base64url VAPID public key to Uint8Array for PushManager.subscribe */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Register (or retrieve existing) service worker */
async function getOrRegisterSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    // Wait for an already-active SW first (avoids double-registration on hot reload)
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) return existing;
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

/** Best-effort check: is the browser subscribed to push? */
async function getExistingSubscription(
  reg: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported:  false,
    isIOS:        false,
    isStandalone: false,
    permission:   'default',
    isSubscribed: false,
    isLoading:    false,
    error:        null,
  });

  const swRef = useRef<ServiceWorkerRegistration | null>(null);

  // ── Detect environment & check existing subscription on mount ────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isIOS =
      /iP(hone|ad|od)/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

    const isSupported =
      'serviceWorker' in navigator &&
      'PushManager'   in window    &&
      'Notification'  in window    &&
      // iOS requires standalone mode (Add to Home Screen) for push
      (!isIOS || isStandalone);

    const permission = 'Notification' in window
      ? (Notification.permission as PushPermission)
      : 'default';

    setState((s) => ({ ...s, isIOS, isStandalone, isSupported, permission }));

    if (!isSupported) return;

    // Register SW silently in background and check subscription status
    getOrRegisterSW().then(async (reg) => {
      if (!reg) return;
      swRef.current = reg;

      const sub        = await getExistingSubscription(reg);
      const permission = Notification.permission as PushPermission;

      setState((s) => ({
        ...s,
        permission,
        // Only report subscribed if permission is still granted
        isSubscribed: sub !== null && permission === 'granted',
      }));
    });

    // Listen for permission changes (Chrome 124+)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((status) => {
        status.onchange = () => {
          setState((s) => ({
            ...s,
            permission: status.state as PushPermission,
            isSubscribed: status.state === 'granted' ? s.isSubscribed : false,
          }));
        };
      }).catch(() => {/* not all browsers support this */});
    }
  }, []);

  // ── Subscribe ──────────────────────────────────────────────────────────────
  const subscribe = useCallback(async (): Promise<boolean> => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      // 1. Request permission — must be triggered by a user gesture
      const permission = await Notification.requestPermission();
      setState((s) => ({ ...s, permission: permission as PushPermission }));

      if (permission !== 'granted') {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: permission === 'denied'
            ? 'Notifications are blocked. Enable them in browser settings.'
            : 'Permission not granted.',
        }));
        return false;
      }

      // 2. Get or register SW — wait until active
      let reg = swRef.current;
      if (!reg) {
        reg = await getOrRegisterSW();
        swRef.current = reg;
      }
      if (!reg) throw new Error('Service Worker could not be registered.');

      // Wait for SW to become active (important on first load)
      await navigator.serviceWorker.ready;

      // 3. Check if already subscribed (don't create duplicate)
      const existing = await getExistingSubscription(reg);
      if (existing) {
        // Re-register with server in case it was lost
        await fetch('/api/push/register', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ subscription: existing.toJSON(), platform: 'web' }),
        });
        setState((s) => ({ ...s, isLoading: false, isSubscribed: true }));
        return true;
      }

      // 4. Create new push subscription
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.');

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // 5. Save to server
      const res = await fetch('/api/push/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subscription: sub.toJSON(), platform: 'web' }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Server failed — unsubscribe locally so state stays consistent
        await sub.unsubscribe();
        throw new Error((body as { error?: string }).error || `Server error ${res.status}`);
      }

      setState((s) => ({ ...s, isLoading: false, isSubscribed: true }));
      return true;
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error:     err instanceof Error ? err.message : 'Subscription failed.',
      }));
      return false;
    }
  }, []);

  // ── Unsubscribe ────────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async (): Promise<void> => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const reg = swRef.current ?? await getOrRegisterSW();
      if (!reg) throw new Error('No service worker found.');

      const sub = await getExistingSubscription(reg);

      if (sub) {
        // 1. Tell the server first (so it stops sending)
        await fetch('/api/push/unregister', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token: JSON.stringify(sub.toJSON()) }),
        }).catch(() => {/* best-effort */});

        // 2. Unsubscribe locally
        await sub.unsubscribe();
      }

      setState((s) => ({ ...s, isLoading: false, isSubscribed: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error:     err instanceof Error ? err.message : 'Unsubscribe failed.',
      }));
    }
  }, []);

  return { ...state, subscribe, unsubscribe };
}
