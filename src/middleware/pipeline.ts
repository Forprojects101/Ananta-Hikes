import { NextRequest, NextResponse } from "next/server";

// ─── Shared Types ────────────────────────────────────────────────────────────

export type MiddlewareResult = NextResponse | null;

export interface RequestContext {
  ip: string;
  userId: string | null;
  pathname: string;
  method: string;
  timestamp: string;
}

// ─── Cookie Names ─────────────────────────────────────────────────────────────
export const AUTH_COOKIE = "auth-token";
export const VERIFIED_COOKIE = "verified-token";

// ─── Route Definitions ────────────────────────────────────────────────────────

/** Paths that NEVER require a session */
export const PUBLIC_PATHS = [
  "/",
  "/auth/signup",
  "/auth/verify",
  "/auth/google",
];

/** Paths that start with these prefixes are always public (static assets, API health, etc.) */
export const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon",
  "/public",
  "/api/auth/",      // auth API routes are public (they create sessions)
  "/api/health",
  "/api/mountains",
  "/api/landing-data",
  "/api/testimonials",
  "/api/group-photos",
];

/** Route groups and the minimum role level required to access them */
export const ROLE_PROTECTED_ROUTES: { prefix: string; minLevel: number; redirect: string }[] = [
  { prefix: "/dashboard/admin",      minLevel: 3, redirect: "/dashboard/client" },
  { prefix: "/dashboard/super-admin", minLevel: 4, redirect: "/dashboard/client" },
  { prefix: "/dashboard/tour-guide", minLevel: 2, redirect: "/dashboard/client" },
];

/** Rate-limited sensitive API endpoints */
export const RATE_LIMITED_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/resend-code",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

export function getAuthToken(req: NextRequest): string | null {
  return req.cookies.get(AUTH_COOKIE)?.value || req.cookies.get(VERIFIED_COOKIE)?.value || null;
}

export function buildContext(req: NextRequest): RequestContext {
  return {
    ip: getClientIp(req),
    userId: getAuthToken(req),    // token IS the userId in this system
    pathname: req.nextUrl.pathname,
    method: req.method,
    timestamp: new Date().toISOString(),
  };
}

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isAuthPage(pathname: string): boolean {
  return pathname.startsWith("/auth/");
}
