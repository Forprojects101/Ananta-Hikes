/**
 * Lightweight CSRF protection for mutating requests (POST / PUT / PATCH / DELETE).
 *
 * Strategy — "double-submit cookie":
 *   1. On the first safe request (GET, HEAD, OPTIONS), the server sends back a
 *      signed CSRF token stored in a readable (non-HttpOnly) cookie.
 *   2. Client-side code reads the cookie and reflects it in the
 *      `x-csrf-token` request header on every mutating request.
 *   3. This middleware compares the cookie value with the header value.
 *      If they don't match (or either is missing), the request is rejected
 *      with 403.
 *
 * Note: Because the attacker's origin cannot read our cookies (SameSite +
 * Same-Origin policy), a forged cross-site request cannot set the header
 * correctly, which is the security guarantee.
 */

import { NextRequest, NextResponse } from "next/server";
import { RequestContext } from "./pipeline";
import { logWarning } from "./logger";

export const CSRF_COOKIE = "csrf-token";
export const CSRF_HEADER = "x-csrf-token";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * API routes that are intentionally exempt from CSRF checks.
 * (e.g. pure server-to-server endpoints or Supabase webhooks.)
 */
const CSRF_EXEMPT_PREFIXES = [
  "/api/auth/login",     // handled by rate-limiter instead
  "/api/auth/signup",
  "/api/auth/verify",
  "/api/auth/resend-code",
];

function isExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
}

export function validateCsrf(
  req: NextRequest,
  ctx: RequestContext
): NextResponse | null {
  // Only check mutating methods
  if (!MUTATING_METHODS.has(req.method)) return null;

  // Exempt paths (auth forms use rate-limiting + other guards)
  if (isExempt(ctx.pathname)) return null;

  const cookieToken  = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken  = req.headers.get(CSRF_HEADER);

  const valid =
    cookieToken &&
    headerToken &&
    cookieToken.length >= 16 &&
    cookieToken === headerToken;

  if (!valid) {
    logWarning({
      method: ctx.method,
      path: ctx.pathname,
      userId: ctx.userId,
      ip: ctx.ip,
      status: 403,
      tag: "CSRF_FAILURE",
      message: `cookie="${cookieToken?.slice(0, 8) ?? "missing"}…" header="${headerToken?.slice(0, 8) ?? "missing"}…"`,
    });

    return NextResponse.json(
      { message: "CSRF token validation failed." },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Generate a random CSRF token and set it in a readable cookie on the response.
 * Call this when issuing the first response on a new session / safe request.
 */
export function setCsrfCookie(response: NextResponse): void {
  // Only set if not already present
  if (response.cookies.get(CSRF_COOKIE)) return;

  const token = crypto.randomUUID().replace(/-/g, "");
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,    // must be readable by client JS
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 h
  });
}
