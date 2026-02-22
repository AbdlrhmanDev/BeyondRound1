import type { Metadata, Viewport } from 'next';
import { DM_Sans, Space_Grotesk, Playfair_Display } from 'next/font/google';
import { DeferredSpeedInsights } from '@/components/DeferredSpeedInsights';
import { CookieConsentProvider } from '@/components/CookieConsentContext';
import { CookieBanner } from '@/components/CookieBanner';
import { ConsentedScripts } from '@/components/analytics/ConsentedScripts';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
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
  viewportFit: 'cover',
  themeColor: '#F7F2EE',
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
        {/* LCP preload: mobile image on small viewports, desktop on large */}
        <link rel="preload" href="/hero-doctors-friendship-mobile.webp" as="image" media="(max-width: 639px)" />
        <link rel="preload" href="/hero-doctors-friendship-card.webp" as="image" media="(min-width: 640px)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BeyondRounds" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} ${playfairDisplay.variable} font-sans antialiased`} suppressHydrationWarning>
        <CookieConsentProvider>
          {children}
          {/* Banner + preferences modal — rendered once at the root */}
          <CookieBanner />
          {/* Third-party scripts gated behind consent */}
          <ConsentedScripts />
        </CookieConsentProvider>
        <DeferredSpeedInsights />
      </body>
    </html>
  );
}
