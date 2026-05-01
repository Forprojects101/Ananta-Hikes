/**
 * src/lib/rate-limit.ts
 *
 * In-memory sliding-window rate limiter for Next.js API routes.
 * Works across requests within a single serverless instance.
 * For multi-instance deployments, swap the Map for Redis/Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Separate stores per route so limits are independent
const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(storeKey: string): Map<string, RateLimitEntry> {
  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map());
  }
  return stores.get(storeKey)!;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check whether an identifier (e.g. IP address) is within the allowed rate.
 *
 * @param storeKey   Unique key per route (e.g. "landing-data")
 * @param identifier Client IP or user ID
 * @param maxRequests Max requests allowed per window (default 60)
 * @param windowMs   Window size in ms (default 60 000 = 1 minute)
 */
export function checkRateLimit(
  storeKey: string,
  identifier: string,
  maxRequests = 60,
  windowMs = 60_000
): RateLimitResult {
  const store = getStore(storeKey);
  const now = Date.now();

  // Periodic cleanup: remove expired entries to prevent memory leaks
  if (store.size > 5_000) {
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key);
    });
  }

  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Extract a reliable client IP from a Next.js Request.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
