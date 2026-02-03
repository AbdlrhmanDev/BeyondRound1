import type { AppProps } from 'next/app';

/**
 * Minimal _app for Pages Router compatibility.
 * App Router handles routing - this satisfies Next.js build.
 */
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
