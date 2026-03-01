import { i18nRouter } from 'next-i18n-router';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { updateSession } from './src/lib/supabase/middleware';
import i18nConfig from './src/i18nConfig';

// Route segments (after the locale prefix) that require authentication
const protectedSegments = new Set([
  'dashboard', 'settings', 'profile', 'matches',
  'chat', 'group-chat', 'places', 'interests',
]);

// Route segments that require admin role
// (API-level admin check is in the route handler; this provides an additional
//  layer that prevents unauthenticated access to admin UI pages)
const adminSegments = new Set(['admin']);

const KNOWN_LOCALES = new Set(['de', 'en']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and public assets
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

  // ── Domain gate: whitelist subdomain only serves the waitlist page ──────────
  const hostname = request.headers.get('host') ?? '';
  if (hostname === 'whitelist.beyondrounds.app') {
    const segments = pathname.split('/').filter(Boolean);
    // Detect locale from path or fall back to default
    const locale = KNOWN_LOCALES.has(segments[0]) ? segments[0] : 'de';
    // Always rewrite (not redirect) to avoid RSC prefetch redirect loops.
    // Middleware does not re-run after a rewrite, so there is no loop risk.
    const waitlistUrl = request.nextUrl.clone();
    waitlistUrl.pathname = `/${locale}/waitlist`;
    return NextResponse.rewrite(waitlistUrl);
  }
  // ────────────────────────────────────────────────────────────────────────────

  // Run i18nRouter first to handle locale detection and redirects
  const i18nResponse = i18nRouter(request, i18nConfig);

  // If i18nRouter issued a redirect, return immediately.
  // Note: i18nRouter uses a `location` header (not x-next-i18n-router-redirected)
  // for redirects, so we check the standard header instead.
  if (i18nResponse.headers.has('location')) {
    return i18nResponse;
  }

  // Determine if this path requires authentication
  // Path structure after i18n: /[locale]/[routeSegment]/...
  const segments = pathname.split('/').filter(Boolean);
  const routeSegment = segments[1] ?? ''; // segments[0] is the locale
  const locale = segments[0] ?? 'de';

  const needsAuth  = protectedSegments.has(routeSegment);
  const needsAdmin = adminSegments.has(routeSegment);

  if (!needsAuth && !needsAdmin) {
    // Public route — just refresh session cookies and continue
    return await updateSession(request, i18nResponse);
  }

  // Protected route — verify the user's session without a network call
  // (createServerClient reads session from cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {}, // middleware can't persist cookie mutations safely
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect unauthenticated users to the login page, preserving the intended destination
    const loginUrl = new URL(`/${locale}/auth`, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated and authorized — refresh session cookies and continue
  // Note: admin role enforcement happens in each /api/admin/* route handler.
  // The middleware only ensures the user is authenticated before seeing admin UI.
  return await updateSession(request, i18nResponse);
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
};
