'use client';

import { ThemeProvider } from 'next-themes';
import { useState, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ConditionalAuthProvider } from '@/providers/ConditionalAuthProvider';

const APP_ROUTES = ['/dashboard', '/settings', '/profile', '/matches', '/chat', '/group-chat', '/places', '/onboarding', '/interests', '/survey', '/admin', '/auth', '/forgot-password', '/welcome'];

function pathNeedsQuery(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_ROUTES.some((route) => pathname.includes(route));
}

function pathNeedsTooltip(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_ROUTES.some((route) => pathname.includes(route));
}

function pathNeedsLocaleProvider(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_ROUTES.some((route) => pathname.includes(route));
}

// Lazy-load heavy providers only for app routes (~100KB+ savings on marketing)
const QueryClientWrapper = dynamic(
  () => import('@/providers/QueryClientWrapper').then((m) => ({ default: m.QueryClientWrapper })),
  { ssr: false }
);
const LocaleProviderWrapper = dynamic(
  () => import('@/providers/LocaleProviderWrapper').then((m) => ({ default: m.LocaleProviderWrapper })),
  { ssr: false }
);
const TooltipProviderWrapper = dynamic(
  () => import('@/providers/TooltipProviderWrapper').then((m) => ({ default: m.TooltipProviderWrapper })),
  { ssr: false }
);

// Defer toasters until after idle - reduces TBT on initial load
const Toaster = dynamic(() => import('@/components/ui/toaster').then((m) => ({ default: m.Toaster })), { ssr: false });
const Sonner = dynamic(() => import('@/components/ui/sonner').then((m) => ({ default: m.Toaster })), { ssr: false });

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();
  const needsQuery = pathNeedsQuery(pathname);
  const needsTooltip = pathNeedsTooltip(pathname);
  const needsLocale = pathNeedsLocaleProvider(pathname);

  const [showToasters, setShowToasters] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowToasters(true), 600);
    return () => clearTimeout(t);
  }, []);

  const inner = (
    <>
      {children}
      {showToasters && (
        <>
          <Toaster />
          <Sonner />
        </>
      )}
    </>
  );

  const withTooltip = needsTooltip ? <TooltipProviderWrapper>{inner}</TooltipProviderWrapper> : inner;
  const withLocale = needsLocale ? <LocaleProviderWrapper>{withTooltip}</LocaleProviderWrapper> : withTooltip;

  const content = (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ConditionalAuthProvider>{withLocale}</ConditionalAuthProvider>
    </ThemeProvider>
  );

  return needsQuery ? (
    <QueryClientWrapper>{content}</QueryClientWrapper>
  ) : (
    content
  );
}
