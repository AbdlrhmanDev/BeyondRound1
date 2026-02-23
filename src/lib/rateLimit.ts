/**
 * Rate limiting for sensitive API routes.
 *
 * Uses an in-memory sliding window counter. This works correctly for
 * single-instance and development deployments.
 *
 * For production multi-instance (Vercel serverless / edge) deployments,
 * upgrade to Upstash Redis for distributed rate limiting:
 *   1. npm install @upstash/ratelimit @upstash/redis
 *   2. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your env
 *   3. Replace the in-memory store below with:
 *      import { Ratelimit } from '@upstash/ratelimit';
 *      import { Redis } from '@upstash/redis';
 *      const redis = Redis.fromEnv();
 *      const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m') });
 */
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-process store — entries are lost on cold start, which is acceptable
// for abuse mitigation (cold starts reset counts, not a security issue).
const store = new Map<string, RateLimitEntry>();

// Periodically remove expired entries to prevent unbounded memory growth.
let lastCleanup = 0;
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

interface RateLimitConfig {
  /** Max requests allowed per window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
}

const PRESETS: Record<string, RateLimitConfig> = {
  billing:   { limit: 10, windowMs: 60_000 }, // 10 per min per user
  push:      { limit: 5,  windowMs: 60_000 }, // 5 per min per user
  whitelist: { limit: 3,  windowMs: 60_000 }, // 3 per min per IP
  admin:     { limit: 20, windowMs: 60_000 }, // 20 per min per user
};

/**
 * Checks the rate limit for an identifier.
 *
 * @param identifier - A unique key: `userId` for authenticated routes, `IP` for public ones.
 * @param preset     - One of the preset configs ('billing' | 'push' | 'whitelist' | 'admin').
 * @returns null if under the limit, or a 429 NextResponse if the limit is exceeded.
 */
export function checkRateLimit(
  identifier: string,
  preset: keyof typeof PRESETS
): NextResponse | null {
  maybeCleanup();

  const cfg = PRESETS[preset];
  const now = Date.now();
  const key = `${preset}:${identifier}`;
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + cfg.windowMs });
    return null;
  }

  if (entry.count >= cfg.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }

  entry.count++;
  return null;
}

/**
 * Extracts the best available identifier for rate limiting.
 * Prefers an authenticated user ID; falls back to the forwarded IP.
 */
export function getRateLimitId(req: NextRequest, userId?: string): string {
  if (userId) return userId;
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
