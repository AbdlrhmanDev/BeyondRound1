'use client';

/**
 * Defers header hydration until after LCP - reduces TBT and main-thread work.
 * Shows skeleton for ~100-300ms, then loads MarketingHeaderClient.
 */
import { IdleDefer } from '@/components/IdleDefer';
import { HeaderSkeleton } from './HeaderSkeleton';
import type { ReactNode } from 'react';

interface DeferredHeaderProps {
  children: ReactNode;
}

export function DeferredHeader({ children }: DeferredHeaderProps) {
  return (
    <IdleDefer fallback={<HeaderSkeleton />} timeoutMs={400}>
      {children}
    </IdleDefer>
  );
}
