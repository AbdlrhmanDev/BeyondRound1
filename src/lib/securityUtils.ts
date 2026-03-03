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
  'No paid invoice found',
  'No payment found to refund',
  'Refund could not be processed',
  'already been refunded',
];

/**
 * Sanitizes an error before returning it to the client.
 * Only passes through known safe user-facing messages;
 * returns a generic message for internal/unexpected errors.
 *
 * Stripe SDK errors expose a numeric `statusCode` — a 4xx from Stripe is a
 * client-side problem (bad data, not configured, etc.) and should not surface
 * as an HTTP 500 to our callers.
 */
export function sanitizeError(err: unknown): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : String(err);

  // Detect Stripe SDK errors by their `statusCode` property
  const stripeStatus =
    err != null && typeof err === 'object' && 'statusCode' in err
      ? (err as { statusCode: unknown }).statusCode
      : null;

  if (typeof stripeStatus === 'number') {
    if (stripeStatus < 500) {
      // Map common Stripe 4xx errors to friendly user-facing messages
      if (raw.includes('No portal configuration') || raw.includes('portal is not configured')) {
        return { message: 'Billing portal is not set up yet. Please contact support.', status: 400 };
      }
      if (raw.includes('No such customer')) {
        return { message: 'Billing account not found. Please contact support.', status: 400 };
      }
      if (raw.includes('No such subscription')) {
        return { message: 'Subscription not found. Please contact support.', status: 400 };
      }
      return { message: 'Payment provider rejected the request. Please try again.', status: 400 };
    }
    // Stripe 5xx → treat as upstream error
    return { message: 'Payment provider is temporarily unavailable. Please try again later.', status: 502 };
  }

  const isUserFacing = USER_FACING_SUBSTRINGS.some(s => raw.includes(s));
  return {
    message: isUserFacing ? raw : 'An unexpected error occurred. Please try again.',
    status: isUserFacing ? 400 : 500,
  };
}
