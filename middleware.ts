import { i18nRouter } from 'next-i18n-router';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './src/lib/supabase/middleware';
import i18nConfig from './src/i18nConfig';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/settings', '/profile', '/matches', '/chat', '/group-chat', '/places', '/onboarding', '/interests'];
const adminRoutes = ['/admin'];
const authRoutes = ['/auth', '/forgot-password', '/welcome'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  // First, run i18nRouter
  const i18nResponse = i18nRouter(request, i18nConfig);

  // If i18nRouter redirected, return the response immediately
  if (i18nResponse.headers.get('x-next-i18n-router-redirected')) {
    return i18nResponse;
  }

  // Run Supabase auth check using the response from i18nRouter
  // This preserves the rewrite/locale settings from i18nRouter while updating cookies
  return await updateSession(request, i18nResponse);
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)'
};
