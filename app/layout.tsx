import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { DM_Sans } from 'next/font/google';
import { DeferredSpeedInsights } from '@/components/DeferredSpeedInsights';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#050508' },
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
      <body className={`${dmSans.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <DeferredSpeedInsights />
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}`}
        </Script>
      </body>
    </html>
  );
}
