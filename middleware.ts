import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Middleware runs on Edge by default in Next.js – no need to export runtime

// Supported locales
const locales = ['de', 'en'];
const defaultLocale = 'de';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/settings', '/profile', '/matches', '/chat', '/group-chat', '/places', '/onboarding'];
const adminRoutes = ['/admin'];
const authRoutes = ['/auth', '/forgot-password'];

function getLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) {
    return segments[0];
  }
  return null;
}

function getLocaleFromHeaders(request: NextRequest): string {
  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().substring(0, 2))
      .find(lang => locales.includes(lang));
    if (preferredLocale) {
      return preferredLocale;
    }
  }
  return defaultLocale;
}

function getLocaleFromCookie(request: NextRequest): string | null {
  const localeCookie = request.cookies.get('beyondrounds_locale');
  if (localeCookie && locales.includes(localeCookie.value)) {
    return localeCookie.value;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API, and public assets (reduces TTFB)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  // Get current locale from path (before redirect so we can redirect with locale)
  const pathLocale = getLocaleFromPath(pathname);

  // If no locale in path, redirect to localized path (no Supabase call needed)
  if (!pathLocale) {
    const locale = getLocaleFromCookie(request) || getLocaleFromHeaders(request);
    const newUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);
    newUrl.search = request.nextUrl.search;
    return NextResponse.redirect(newUrl);
  }

  // Get the path without locale for route matching
  const pathWithoutLocale = pathname.replace(`/${pathLocale}`, '') || '/';

  // Only refresh Supabase session for routes that may need auth (faster for marketing pages)
  const isProtectedRoute = protectedRoutes.some(route => pathWithoutLocale.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathWithoutLocale.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathWithoutLocale.startsWith(route));
  const needsSession = isProtectedRoute || isAdminRoute || isAuthRoute;

  const response = needsSession ? await updateSession(request) : NextResponse.next({
    request: { headers: request.headers },
  });

  // Set locale cookie for persistence
  response.cookies.set('beyondrounds_locale', pathLocale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax',
  });

  response.headers.set('x-locale', pathLocale);
  response.headers.set('x-pathname', pathWithoutLocale);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
