'use client';

/**
 * Only loads AuthProvider (and Supabase) for app routes.
 * Marketing pages skip auth entirely - saves ~100KB+ and main-thread work.
 */
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { isAppRoute } from '@/lib/routes';

const AuthProvider = dynamic(
  () => import('@/hooks/useAuth').then((m) => ({ default: m.AuthProvider })),
  { ssr: false }
);

export function ConditionalAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isAppRoute(pathname)) {
    return <AuthProvider>{children}</AuthProvider>;
  }
  return <>{children}</>;
}
