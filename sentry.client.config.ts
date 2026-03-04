import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions for performance monitoring (free tier friendly)
  tracesSampleRate: 0.1,

  // Capture 100% of errors
  // Adjust in production if volume is too high
  sampleRate: 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // Don't send PII
  sendDefaultPii: false,

  // Ignore common noisy errors that aren't actionable
  ignoreErrors: [
    // Browser extensions
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors (user went offline)
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    // User cancelled navigation
    'AbortError',
    // Next.js router navigation (not real errors)
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
  ],
});
