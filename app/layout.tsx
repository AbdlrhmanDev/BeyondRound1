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

const OG_IMAGE = {
  url: '/hero-doctors-friendship.jpg',
  width: 1200,
  height: 800,
  alt: 'Doctors enjoying a relaxed dinner together — BeyondRounds',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://beyondrounds.app'),
  title: {
    default: 'BeyondRounds — Weekly Meetups for Doctors in Berlin',
    template: '%s | BeyondRounds',
  },
  description: 'BeyondRounds matches verified doctors in small curated groups for real weekend meetups. No swiping. No networking. Just genuine friendships.',
  keywords: ['physicians', 'doctors', 'Berlin', 'doctor meetups', 'medical community', 'friendship', 'healthcare'],
  authors: [{ name: 'BeyondRounds' }],
  creator: 'BeyondRounds',
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    alternateLocale: 'en_US',
    url: 'https://beyondrounds.app',
    siteName: 'BeyondRounds',
    title: 'BeyondRounds — Weekly Meetups for Doctors in Berlin',
    description: 'We match verified doctors in small curated groups for real weekend meetups.',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeyondRounds — Weekly Meetups for Doctors',
    description: 'Verified doctors. Small groups. Real friendships.',
    images: ['/hero-doctors-friendship.jpg'],
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
        <link rel="icon" href="/br-icon.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/br-icon.jpg" />
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
