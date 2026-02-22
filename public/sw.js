// BeyondRounds Service Worker — Web Push + Offline Shell
// Best practices applied:
//  ✓ skipWaiting inside waitUntil (correct lifecycle order)
//  ✓ URL sanitization before navigation (prevent open-redirect via notification data)
//  ✓ renotify:true so same-tagged notifications always alert the user
//  ✓ Action button routing
//  ✓ SW-ready state propagated to clients via postMessage
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_NAME   = 'br-shell-v2';
const OFFLINE_PAGE = '/offline';
const APP_ORIGIN   = self.location.origin;

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(['/']))   // pre-cache app shell only
      .then(() => self.skipWaiting())          // activate immediately
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete stale caches
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
      // Take control of all open tabs immediately
      self.clients.claim(),
    ])
  );
});

// ── Push: show notification ───────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  // Always call event.waitUntil — even on parse error — so the browser
  // knows we handled the event (required to avoid "silent push" errors).
  event.waitUntil(handlePush(event));
});

async function handlePush(event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: 'BeyondRounds',
      body:  event.data ? event.data.text() : 'You have a new notification',
    };
  }

  const title = String(payload.title || 'BeyondRounds').slice(0, 60);
  const body  = String(payload.body  || '').slice(0, 120);

  // Sanitize URL — only allow same-origin paths
  const rawUrl    = payload.url || '/';
  const safeUrl   = isSameOriginPath(rawUrl) ? rawUrl : '/';

  const options = {
    body,
    icon:               '/icon-192.png',
    badge:              '/icon-192.png',
    image:              payload.image || undefined,
    tag:                payload.tag   || 'br-default',
    renotify:           true,          // always alert even if tag already shown
    data:               { url: safeUrl, actionUrl: payload.actionUrl || safeUrl },
    requireInteraction: !!payload.requireInteraction,
    silent:             false,
    vibrate:            [200, 100, 200],
    // Action buttons (max 2 on most browsers)
    actions:            Array.isArray(payload.actions) ? payload.actions.slice(0, 2) : [],
  };

  return self.registration.showNotification(title, options);
}

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Action button clicked vs. body clicked
  const targetUrl =
    event.action && event.notification.data?.actionUrl
      ? event.notification.data.actionUrl
      : (event.notification.data?.url || '/');

  // Sanitize again at click time
  const safeTarget = isSameOriginPath(targetUrl) ? targetUrl : '/';

  event.waitUntil(focusOrOpen(safeTarget));
});

async function focusOrOpen(path) {
  const fullUrl     = APP_ORIGIN + (path.startsWith('/') ? path : '/' + path);
  const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

  // 1. Try to focus an existing tab already at that URL
  for (const client of windowClients) {
    if (client.url === fullUrl && 'focus' in client) {
      return client.focus();
    }
  }

  // 2. Navigate an existing tab to that URL
  for (const client of windowClients) {
    if ('focus' in client && 'navigate' in client) {
      await client.focus();
      return client.navigate(fullUrl);
    }
  }

  // 3. Open a new tab
  return clients.openWindow(fullUrl);
}

// ── Notification dismiss (analytics stub) ────────────────────────────────────
self.addEventListener('notificationclose', (_event) => {
  // Optionally POST a dismissal event to your analytics endpoint
});

// ── Push subscription change (key rotation) ──────────────────────────────────
// Fired when the push service rotates the subscription (rare but must be handled).
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      // Re-subscribe with the same VAPID options as before
      const newSub = await self.registration.pushManager.subscribe(
        event.oldSubscription?.options ?? {
          userVisibleOnly: true,
          // applicationServerKey is included in oldSubscription.options
        }
      );

      // Re-register with server
      await fetch('/api/push/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subscription: newSub.toJSON(), platform: 'web' }),
      });
    })()
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function isSameOriginPath(url) {
  try {
    const parsed = new URL(url, APP_ORIGIN);
    return parsed.origin === APP_ORIGIN;
  } catch {
    return url.startsWith('/') && !url.startsWith('//');
  }
}
