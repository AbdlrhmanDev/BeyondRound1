/**
 * Shared security utilities for API route validation.
 * Used across billing, push, and admin routes.
 */

/**
 * Returns the set of allowed Stripe price IDs from environment variables.
 * Any priceId not in this set is rejected before touching the Stripe API.
 */
export function getAllowedPriceIds(): Set<string> {
  return new Set(
    [
      process.env.STRIPE_PRICE_ID_ONE_TIME,
      process.env.STRIPE_PRICE_ID_MONTHLY,
      process.env.STRIPE_PRICE_ID_THREE_MONTH,
      process.env.STRIPE_PRICE_ID_SIX_MONTH,
    ].filter((id): id is string => typeof id === 'string' && id.startsWith('price_'))
  );
}

const ALLOWED_RETURN_HOSTS = new Set([
  'app.beyondrounds.app',
  'admin.beyondrounds.app',
  'whitelist.beyondrounds.app',
  'checkout.beyondrounds.app',
  'localhost',
]);

/**
 * Validates that a return/redirect URL belongs to an allowed host.
 * Returns the URL if valid, or the fallback URL if not.
 * Prevents open-redirect attacks on portal return URLs.
 */
export function validateReturnUrl(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  try {
    const url = new URL(raw);
    // Must use HTTPS (localhost may use http)
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return fallback;
    // Host must be in our allowlist
    if (!ALLOWED_RETURN_HOSTS.has(url.hostname)) return fallback;
    return raw;
  } catch {
    return fallback;
  }
}

// Known user-facing error substrings that are safe to return to clients
const USER_FACING_SUBSTRINGS = [
  'already have an active subscription',
  'Invalid plan selected',
  'No active subscription',
  'No subscription found',
  'No billing account',
  'Subscription is not pending cancellation',
  'Subscription has already ended',
  'You are already on this plan',
  'Cannot switch plan',
  'priceId is required',
  'newPriceId is required',
];

/**
 * Sanitizes an error before returning it to the client.
 * Only passes through known safe user-facing messages;
 * returns a generic message for internal/unexpected errors.
 */
export function sanitizeError(err: unknown): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : String(err);
  const isUserFacing = USER_FACING_SUBSTRINGS.some(s => raw.includes(s));
  return {
    message: isUserFacing ? raw : 'An unexpected error occurred. Please try again.',
    status: isUserFacing ? 400 : 500,
  };
}
