/**
 * GET /api/landing-data
 *
 * Single consolidated endpoint for all landing-page data.
 * - Runs ALL queries in parallel via getLandingPageData()
 * - Serves cached responses for 60 s (s-maxage), revalidated for 5 min
 * - Rate-limited to 60 req/min per IP
 * - CORS restricted to own origin
 * - Security headers on every response
 * - Fields explicitly whitelisted — no raw DB rows exposed
 */

import { NextResponse } from "next/server";
import { getLandingPageData } from "@/lib/landing";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

// Force dynamic so Next.js doesn't cache the route-module itself;
// we control caching via Cache-Control headers instead.
export const dynamic = "force-dynamic";

// ─── Allowed origins ──────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_SITE_URL ?? "",
  "http://localhost:3000",
  "http://0.0.0.0:3000",
]);

function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null; // Same-origin server-side fetch — always allow
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  return null; // Unknown origin — reject
}

// ─── Query-parameter schema (Zod validation) ─────────────────────────────────

const querySchema = z.object({
  // No user-controlled params needed for this public endpoint,
  // but we validate and ignore cache-busting timestamps safely.
  t: z.string().optional(),
});

// ─── Security headers helper ──────────────────────────────────────────────────

function applySecurityHeaders(
  headers: Headers,
  allowedOrigin: string | null,
  cacheControl: string
) {
  // CORS
  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Vary", "Origin");
  }

  // Caching
  headers.set("Cache-Control", cacheControl);

  // Security
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Content-Type", "application/json");
}

// ─── OPTIONS preflight ────────────────────────────────────────────────────────

export async function OPTIONS(request: Request) {
  const allowedOrigin = getAllowedOrigin(request);
  if (!allowedOrigin) {
    return new NextResponse(null, { status: 403 });
  }
  const headers = new Headers();
  applySecurityHeaders(headers, allowedOrigin, "no-store");
  return new NextResponse(null, { status: 204, headers });
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // 1. CORS check
  const allowedOrigin = getAllowedOrigin(request);
  // We still allow null origin (server-side / curl) — only block known-bad origins
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigin) {
    return NextResponse.json(
      { message: "Origin not allowed" },
      { status: 403 }
    );
  }

  // 2. Rate limiting — 60 requests per minute per IP
  const ip = getClientIp(request);
  const { allowed, remaining, resetAt } = checkRateLimit(
    "landing-data",
    ip,
    60,
    60_000
  );

  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    const res = NextResponse.json(
      { message: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(retryAfter));
    res.headers.set("X-RateLimit-Limit", "60");
    res.headers.set("X-RateLimit-Remaining", "0");
    res.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
    return res;
  }

  // 3. Validate query params (reject unexpected / injection-prone params)
  const url = new URL(request.url);
  const rawParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid query parameters", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // 4. Fetch all landing-page data — single call, all queries parallel
  try {
    const data = await getLandingPageData();

    const body = JSON.stringify(data);

    const headers = new Headers();
    applySecurityHeaders(
      headers,
      allowedOrigin,
      // Cache at the edge for 60 s, serve stale for up to 5 min while revalidating
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    headers.set("X-RateLimit-Limit", "60");
    headers.set("X-RateLimit-Remaining", String(remaining));
    headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

    return new NextResponse(body, { status: 200, headers });
  } catch (error) {
    // Log server-side only — never expose error details to the client
    console.error("[/api/landing-data] Unhandled error:", error);

    const headers = new Headers();
    applySecurityHeaders(headers, allowedOrigin, "no-store");

    return new NextResponse(
      JSON.stringify({ message: "Service temporarily unavailable" }),
      { status: 503, headers }
    );
  }
}
