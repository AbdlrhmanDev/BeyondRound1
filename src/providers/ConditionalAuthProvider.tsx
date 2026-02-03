'use client';

/**
 * Only loads AuthProvider (and Supabase) for app routes.
 * Marketing pages skip auth entirely - saves ~100KB+ and main-thread work.
 */
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const AuthProvider = dynamic(
  () => import('@/hooks/useAuth').then((m) => ({ default: m.AuthProvider })),
  { ssr: false }
);

const APP_ROUTES = ['/dashboard', '/settings', '/profile', '/matches', '/chat', '/group-chat', '/places', '/onboarding', '/interests', '/survey', '/admin', '/auth', '/forgot-password', '/welcome'];

function pathNeedsAuth(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_ROUTES.some((route) => pathname.includes(route));
}

export function ConditionalAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const needsAuth = pathNeedsAuth(pathname);

  if (needsAuth) {
    return <AuthProvider>{children}</AuthProvider>;
  }
  return <>{children}</>;
}
