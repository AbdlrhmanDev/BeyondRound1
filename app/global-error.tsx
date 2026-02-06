'use client';

/**
 * Global error boundary - catches errors that bubble up from the root.
 * Must NOT use usePathname, useRouter, or any hooks that require React context,
 * as the context may be null when this renders.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#a1a1aa', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              An unexpected error occurred. Please try again.
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '1rem' }}>
                Error ID: {error.digest}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  backgroundColor: '#f97316',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: '#fafafa',
                  border: '1px solid #3f3f46',
                  textDecoration: 'none',
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
