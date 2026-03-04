import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions
  tracesSampleRate: 0.1,

  // Capture 100% of errors
  sampleRate: 1.0,

  enabled: process.env.NODE_ENV === 'production',

  sendDefaultPii: false,
});
