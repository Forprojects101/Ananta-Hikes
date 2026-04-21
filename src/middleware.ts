import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

const REFRESH_TOKEN_COOKIE = "refresh_token";
const CSRF_COOKIE         = "csrf-token";
const CSRF_HEADER         = "x-csrf-token";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-me"
);

/** Exact paths that are always public */
const PUBLIC_PATHS = new Set([
  "/",
  "/auth/signup",
  "/auth/verify",
  "/auth/google/callback",
]);

/** Path prefixes that are always public */
const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon",
  "/public",
  "/api/auth/",   // login, logout, refresh are handled by their routes
  "/api/health",
  "/api/mountains",
  "/api/landing-data",
  "/api/testimonials",
  "/api/group-photos",
  "/api/schedule",
  "/api/expeditions",
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const ROLE_GATES = [
  { prefix: "/dashboard/super-admin", minLevel: 4, redirect: "/dashboard/client" },
  { prefix: "/dashboard/admin",       minLevel: 3, redirect: "/dashboard/client" },
  { prefix: "/dashboard/tour-guide",  minLevel: 2, redirect: "/dashboard/client" },
];

const ROLE_HIERARCHY: Record<string, number> = {
  "Hiker":       1,
  "Tour Guide":  2,
  "Admin":       3,
  "Super Admin": 4,
};

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "unknown"
  );
}

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; role: string };
  } catch (err) {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Security headers
// ─────────────────────────────────────────────────────────────────────────────

function attachSecurityHeaders(headers: Headers) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main middleware
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method       = req.method;
  const ip           = getIp(req);

  // 1. Skip public paths immediately
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 2. Extract Auth Info
  const authHeader = req.headers.get("Authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // 3. API Protection
  if (pathname.startsWith("/api/")) {
    if (!accessToken) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const payload = await verifyJwt(accessToken);
    if (!payload) {
      return NextResponse.json({ message: "Token expired or invalid" }, { status: 401 });
    }

    // Pass through for API
    const res = NextResponse.next();
    attachSecurityHeaders(res.headers);
    return res;
  }

  // 4. Page Protection (Dashboard etc.)
  if (pathname.startsWith("/dashboard")) {
    // For pages, we don't have the access token in the header (usually).
    // We check for the refresh token cookie. If it's missing, they are definitely logged out.
    if (!refreshToken) {
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If refresh token exists, we allow the page to load.
    // The client-side AuthContext will then attempt to get an access token.
    const res = NextResponse.next();
    attachSecurityHeaders(res.headers);
    return res;
  }

  // 5. Default pass through
  const res = NextResponse.next();
  attachSecurityHeaders(res.headers);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
