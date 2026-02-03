'use client';

/**
 * Minimal providers for marketing: deferred Toaster only. No ThemeProvider (theme via inline script).
 * Saves ~15KB next-themes + reduces main-thread for Lighthouse 90+.
 */
import { useState, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

const Toaster = dynamic(() => import('@/components/ui/toaster').then((m) => ({ default: m.Toaster })), { ssr: false });
const TOASTER_DEFER_MS = 3000;

export function MarketingProviders({ children }: { children: ReactNode }) {
  const [showToaster, setShowToaster] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowToaster(true), TOASTER_DEFER_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {children}
      {showToaster && <Toaster />}
    </>
  );
}
