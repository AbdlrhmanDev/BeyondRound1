/**
 * Shared route configuration for performance optimization
 * Used by providers to determine which routes need which features
 *
 * IMPORTANT: Update this list when adding new app routes
 */

// Routes that require full app providers (auth, query, i18n, etc.)
export const APP_ROUTES = [
  '/dashboard',
  '/settings',
  '/profile',
  '/matches',
  '/chat',
  '/places',
  '/onboarding',
  '/interests',
  '/survey',
  '/admin',
  '/auth',
  '/forgot-password',
  '/welcome',
  '/events',
  '/book',
  '/edit-profile',
] as const;

// Marketing routes (minimal providers, no auth needed)
export const MARKETING_ROUTES = [
  '/',
  '/for-doctors',
  '/how-it-works',
  '/pricing',
  '/faq',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/waitlist',
] as const;

/**
 * Check if a pathname needs full app providers
 */
export function isAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_ROUTES.some((route) => pathname.includes(route));
}

/**
 * Check if a pathname is a marketing route
 */
export function isMarketingRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  // Root path exact match or starts with marketing route
  if (pathname === '/' || pathname.match(/^\/[a-z]{2}$/)) return true;
  return MARKETING_ROUTES.some((route) => pathname.includes(route));
}
