import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  sendDefaultPii: true,

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  profilesSampleRate: 1.0,

  // Session Replay: 10% of all sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
    Sentry.browserProfilingIntegration(),
  ],

  // Ignore noisy non-actionable errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    "AbortError",
    "NEXT_REDIRECT",
    "NEXT_NOT_FOUND",
    // Browser extension noise
    "MetaMask extension not found",
    "Failed to connect to MetaMask",
    /^Extension context invalidated/,
    /^chrome-extension/,
    /^moz-extension/,
  ],

  // Drop errors that originate from browser extensions entirely
  denyUrls: [
    /^app:\/\/\/scripts\//,
    /chrome-extension:\/\//i,
    /moz-extension:\/\//i,
    /extensions\//i,
  ],

  enabled: process.env.NODE_ENV === "production",
});

