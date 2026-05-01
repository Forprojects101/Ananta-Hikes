/**
 * GET /api/mountains
 *
 * Public endpoint that returns active mountains for the landing page.
 * - Single optimized query (no duplicate ALL + ACTIVE queries)
 * - Explicit field selection — no raw DB rows
 * - Cached at edge for 2 minutes, stale-while-revalidate 10 minutes
 * - Rate-limited to 60 req/min per IP
 * - CORS restricted to own origin
 * - Security headers on all responses
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateCloudinaryUrl } from "@/lib/landing";
import { z } from "zod";

export const dynamic = "force-dynamic";

// ─── Supabase server client ───────────────────────────────────────────────────

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Price derivation ─────────────────────────────────────────────────────────

function derivePrice(row: {
  price?: number | string | null;
  hike_types?: { price?: number | string | null }[];
}): number {
  if (row.price !== null && row.price !== undefined && row.price !== "") {
    const parsed = Number(row.price);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }

  const hikeTypes = Array.isArray(row.hike_types) ? row.hike_types : [];
  const prices = hikeTypes
    .map((t) => Number(t?.price))
    .filter((v) => Number.isFinite(v) && v >= 0);

  return prices.length > 0 ? Math.min(...prices) : 0;
}

// ─── Allowed origins ──────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_SITE_URL ?? "",
  "http://localhost:3000",
  "http://0.0.0.0:3000",
]);

function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  return null;
}

// ─── Security headers ─────────────────────────────────────────────────────────

function applySecurityHeaders(
  headers: Headers,
  allowedOrigin: string | null,
  cacheControl: string
) {
  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Vary", "Origin");
  }
  headers.set("Cache-Control", cacheControl);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Content-Type", "application/json");
}

// ─── Query-parameter schema ───────────────────────────────────────────────────

const querySchema = z.object({
  t: z.string().optional(), // Cache-busting timestamp — validated then ignored
});

// ─── OPTIONS preflight ────────────────────────────────────────────────────────

export async function OPTIONS(request: Request) {
  const allowedOrigin = getAllowedOrigin(request);
  if (!allowedOrigin) return new NextResponse(null, { status: 403 });
  const headers = new Headers();
  applySecurityHeaders(headers, allowedOrigin, "no-store");
  return new NextResponse(null, { status: 204, headers });
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // 1. CORS
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(request);
  if (origin && !allowedOrigin) {
    return NextResponse.json({ message: "Origin not allowed" }, { status: 403 });
  }

  // 2. Rate limiting
  const ip = getClientIp(request);
  const { allowed, remaining, resetAt } = checkRateLimit(
    "mountains",
    ip,
    60,
    60_000
  );

  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    const res = NextResponse.json(
      { message: "Too many requests" },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(retryAfter));
    return res;
  }

  // 3. Validate query params
  const url = new URL(request.url);
  const rawParams: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { rawParams[k] = v; });

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid query parameters" },
      { status: 400 }
    );
  }

  // 4. Single DB query — whitelisted fields only
  try {
    const supabase = getServerClient();

    const { data, error } = await supabase
      .from("mountains")
      .select(
        "id, name, location, difficulty, elevation_meters, max_participants, image_url, hike_types:hike_types(price)"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("[/api/mountains] DB error:", error.message);
      const headers = new Headers();
      applySecurityHeaders(headers, allowedOrigin, "no-store");
      return new NextResponse(
        JSON.stringify({ 
          message: "Failed to fetch mountains",
          error: error.message,
          details: error.details,
          hint: error.hint
        }),
        { status: 500, headers }
      );
    }

    const mountains = (data || []).map((m: any) => ({
      id: String(m.id),
      name: m.name || "Unnamed Mountain",
      location: m.location || "Philippines",
      difficulty: m.difficulty || "Beginner",
      elevation_meters:
        m.elevation_meters != null ? Number(m.elevation_meters) : null,
      max_participants:
        m.max_participants != null ? Number(m.max_participants) : null,
      image_url: validateCloudinaryUrl(m.image_url),
      price: derivePrice(m),
      is_active: true,
    }));

    const headers = new Headers();
    applySecurityHeaders(
      headers,
      allowedOrigin,
      // Mountains change infrequently — cache 2 min, revalidate up to 10 min
      "public, s-maxage=120, stale-while-revalidate=600"
    );
    headers.set("X-RateLimit-Remaining", String(remaining));

    return new NextResponse(
      JSON.stringify({ mountains }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("[/api/mountains] Unhandled error:", error);
    const headers = new Headers();
    applySecurityHeaders(headers, allowedOrigin, "no-store");
    return new NextResponse(
      JSON.stringify({ message: "Service temporarily unavailable" }),
      { status: 503, headers }
    );
  }
}
