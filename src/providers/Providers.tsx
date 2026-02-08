'use client';

import { ThemeProvider } from 'next-themes';
import { useState, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ConditionalAuthProvider } from '@/providers/ConditionalAuthProvider';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { isAppRoute } from '@/lib/routes';

// Lazy-load heavy providers only for app routes (~100KB+ savings on marketing)
const QueryClientWrapper = dynamic(
  () => import('@/providers/QueryClientWrapper').then((m) => ({ default: m.QueryClientWrapper })),
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
  // Single check for all app providers (DRY + consistent)
  const needsAppProviders = isAppRoute(pathname);

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

  const withTooltip = needsAppProviders ? <TooltipProviderWrapper>{inner}</TooltipProviderWrapper> : inner;
  const withLocale = needsAppProviders ? <LocaleProvider>{withTooltip}</LocaleProvider> : withTooltip;

  const content = (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ConditionalAuthProvider>{withLocale}</ConditionalAuthProvider>
    </ThemeProvider>
  );

  return needsAppProviders ? (
    <QueryClientWrapper>{content}</QueryClientWrapper>
  ) : (
    content
  );
}
