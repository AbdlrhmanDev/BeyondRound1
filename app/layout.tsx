import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { DM_Sans } from 'next/font/google';
import { DeferredSpeedInsights } from '@/components/DeferredSpeedInsights';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'optional',
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: 'BeyondRounds - Connect with Fellow Physicians',
    template: '%s | BeyondRounds',
  },
  description: 'BeyondRounds helps physicians build meaningful friendships beyond the hospital. Join a community of doctors who share your interests.',
  keywords: ['physicians', 'doctors', 'networking', 'medical community', 'friendship', 'healthcare'],
  authors: [{ name: 'BeyondRounds' }],
  creator: 'BeyondRounds',
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    alternateLocale: 'en_US',
    url: 'https://beyondrounds.app',
    siteName: 'BeyondRounds',
    title: 'BeyondRounds - Connect with Fellow Physicians',
    description: 'Build meaningful friendships beyond the hospital.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeyondRounds',
    description: 'Connect with fellow physicians who share your interests.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preload" href="/hero-doctors-friendship-mobile.webp" as="image" />
      </head>
      <body className={`${dmSans.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <DeferredSpeedInsights />
        <Script id="theme-init" strategy="lazyOnload">
          {`(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`}
        </Script>
      </body>
    </html>
  );
}
