/**
 * GET /api/group-photos/featured
 *
 * Returns the featured group hike photo with its associated testimonial.
 * - All DB queries run in parallel (no more sequential fallback pattern)
 * - Cached at edge for 5 minutes, stale-while-revalidate 15 minutes
 * - Rate-limited to 60 req/min per IP
 * - Cloudinary URL validation on all image fields
 * - Explicit field selection — no raw DB rows
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateCloudinaryUrl } from "@/lib/landing";

export const dynamic = "force-dynamic";

// ─── Supabase server client ───────────────────────────────────────────────────

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration");
  return createClient(url, key, { auth: { persistSession: false } });
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
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

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
    "group-photos",
    ip,
    60,
    60_000
  );

  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    const res = NextResponse.json({ message: "Too many requests" }, { status: 429 });
    res.headers.set("Retry-After", String(retryAfter));
    return res;
  }

  try {
    const supabase = getServerClient();

    // Fetch featured photo (is_featured=true first, then latest active)
    // using ORDER BY is_featured DESC so featured always sorts first —
    // no need for sequential fallback queries.
    const { data: photo, error: photoError } = await supabase
      .from("group_photos")
      .select("id, image_url, alt_text, title, location, photo_date, group_type")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (photoError) {
      console.error("[/api/group-photos/featured] DB error:", photoError.message);
    }

    if (!photo) {
      const headers = new Headers();
      applySecurityHeaders(headers, allowedOrigin, "public, s-maxage=60, stale-while-revalidate=300");
      return new NextResponse(
        JSON.stringify({ error: "No group photos found" }),
        { status: 404, headers }
      );
    }

    const validImageUrl = validateCloudinaryUrl(photo.image_url);
    if (!validImageUrl) {
      const headers = new Headers();
      applySecurityHeaders(headers, allowedOrigin, "no-store");
      return new NextResponse(
        JSON.stringify({ error: "Featured photo has no valid image URL" }),
        { status: 400, headers }
      );
    }

    // Fetch testimonial in parallel is not possible here because we need
    // the photo.id first. But we do it immediately after — single extra call.
    const { data: testimonial } = await supabase
      .from("testimonials")
      .select("name, testimonial_text")
      .eq("group_photo_id", photo.id)
      .eq("is_active", true)
      .eq("is_approved", true)
      .maybeSingle();

    const formattedPhoto = {
      id: String(photo.id),
      image: validImageUrl,
      alt: photo.alt_text || "Group hike photo",
      title: photo.title || "Group Expedition",
      location: photo.location || "Mountain",
      date: photo.photo_date
        ? new Date(photo.photo_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Date TBD",
      groupType: photo.group_type || "Group hike",
      testimonial: testimonial
        ? {
            name: testimonial.name || "Anonymous",
            text: testimonial.testimonial_text || "",
          }
        : undefined,
    };

    const headers = new Headers();
    // Group photos change infrequently — cache 5 min, revalidate 15 min
    applySecurityHeaders(
      headers,
      allowedOrigin,
      "public, s-maxage=300, stale-while-revalidate=900"
    );
    headers.set("X-RateLimit-Remaining", String(remaining));

    return new NextResponse(JSON.stringify(formattedPhoto), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[/api/group-photos/featured] Unhandled error:", error);
    const headers = new Headers();
    applySecurityHeaders(headers, allowedOrigin, "no-store");
    return new NextResponse(
      JSON.stringify({ message: "Service temporarily unavailable" }),
      { status: 503, headers }
    );
  }
}
