/**
 * src/lib/landing.ts
 *
 * Single source of truth for all landing-page data.
 * Called from ONE place (/api/landing-data) so caching,
 * logging, and field whitelisting live here and nowhere else.
 */

import { createClient } from "@supabase/supabase-js";

// ─── Supabase server client (service-role, server-only) ──────────────────────

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Cloudinary URL validation ────────────────────────────────────────────────

const CLOUDINARY_PREFIX = "https://res.cloudinary.com/";
const PLACEHOLDER_IMAGE = "/placeholder-mountain.jpg";

export function validateCloudinaryUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Allow Cloudinary URLs
  if (url.startsWith(CLOUDINARY_PREFIX)) return url;
  // Allow relative paths (local assets)
  if (url.startsWith("/")) return url;
  // Allow any http/https URL — images may be hosted outside Cloudinary
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Reject anything else (data:, javascript:, etc.)
  return null;
}

// ─── Public types (safe to expose to client) ─────────────────────────────────

export type PublicMountain = {
  id: string;
  name: string;
  location: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  elevation_meters: number | null;
  duration_hours?: number | null;
  max_participants: number | null;
  image_url: string | null;
  price: number;
};

export type PublicTestimonial = {
  name: string;
  profile_url: string | null;
  star_rate: number;
  testimonial_text: string;
};

export type PublicContentSetting = {
  key: string;
  value: string;
};

export type PublicPromotion = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_url: string;
};

export type PublicGroupPhoto = {
  id: string;
  image_url: string;
  alt_text: string;
  title: string;
  location: string;
  date: string;
  group_type: string;
  testimonial: { name: string; text: string } | null;
};

export type LandingPageData = {
  mountains: PublicMountain[];
  testimonials: PublicTestimonial[];
  contentSettings: PublicContentSetting[];
  activePromotion: PublicPromotion | null;
  featuredGroupPhoto: PublicGroupPhoto | null;
};

// ─── Price derivation (safe utility) ─────────────────────────────────────────

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

// ─── Main data-fetching function ──────────────────────────────────────────────

export async function getLandingPageData(): Promise<LandingPageData> {
  const supabase = getServerClient();

  // All five queries run in parallel — one round-trip to the DB layer
  const [
    mountainsResult,
    testimonialsResult,
    contentSettingsResult,
    promotionResult,
    groupPhotoResult,
  ] = await Promise.allSettled([
    supabase
      .from("mountains")
      .select(
        "id, name, location, difficulty, elevation_meters, max_participants, image_url, hike_types:hike_types(price)"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8),

    // 2. Testimonials — explicit fields only
    supabase
      .from("testimonials")
      .select("name, profile_url, star_rate, testimonial_text")
      .eq("is_active", true)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(8),

    // 3. Content settings — explicit keys only
    supabase
      .from("content_settings")
      .select("key, value")
      .in("key", [
        "mountain_selection_heading",
        "testimonials_heading",
        "hero_subtitle",
      ]),

    // 4. Active promotion — explicit fields, not select("*")
    supabase
      .from("promotions")
      .select("id, title, description, image_url, link_url")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // 5. Featured group photo + its testimonial in one go
    supabase
      .from("group_photos")
      .select(
        "id, image_url, alt_text, title, location, photo_date, group_type"
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false }) // featured first
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // ── Mountains ──────────────────────────────────────────────────────────────
  let mountains: PublicMountain[] = [];
  if (mountainsResult.status === "fulfilled") {
    const { data, error } = mountainsResult.value;
    if (error) {
      console.error("[landing] Mountains DB error:", error.message, "| code:", error.code);
    } else if (data && data.length > 0) {
      mountains = data.map((m: any) => ({
        id: String(m.id),
        name: m.name || "Unnamed Mountain",
        location: m.location || "Philippines",
        difficulty: (m.difficulty as PublicMountain["difficulty"]) || "Beginner",
        elevation_meters:
          m.elevation_meters != null ? Number(m.elevation_meters) : null,
        max_participants:
          m.max_participants != null ? Number(m.max_participants) : null,
        image_url: validateCloudinaryUrl(m.image_url),
        price: derivePrice(m),
      }));
    } else if (data) {
      console.warn("[landing] Mountains query succeeded but returned 0 rows. Check is_active=true records.");
    }
  } else {
    console.error("[landing] Mountains Promise rejected:", mountainsResult.reason);
  }

  // ── Testimonials ───────────────────────────────────────────────────────────
  let testimonials: PublicTestimonial[] = [];
  if (testimonialsResult.status === "fulfilled") {
    const { data, error } = testimonialsResult.value;
    if (error) {
      console.error("[landing] Testimonials DB error:", error.message);
    } else if (data) {
      testimonials = data.map((t: any) => ({
        name: t.name || "Anonymous",
        profile_url: validateCloudinaryUrl(t.profile_url),
        star_rate: Math.min(5, Math.max(1, Number(t.star_rate) || 5)),
        testimonial_text: t.testimonial_text || "",
      }));
    }
  } else {
    console.error("[landing] Testimonials Promise rejected:", testimonialsResult.reason);
  }

  // ── Content settings ───────────────────────────────────────────────────────
  let contentSettings: PublicContentSetting[] = [];
  if (contentSettingsResult.status === "fulfilled") {
    const { data, error } = contentSettingsResult.value;
    if (error) {
      console.error("[landing] Content settings DB error:", error.message);
    } else if (data) {
      contentSettings = data.map((s: any) => ({
        key: String(s.key),
        value: String(s.value),
      }));
    }
  } else {
    console.error("[landing] Content settings Promise rejected:", contentSettingsResult.reason);
  }

  // ── Active promotion ───────────────────────────────────────────────────────
  let activePromotion: PublicPromotion | null = null;
  if (promotionResult.status === "fulfilled") {
    const { data, error } = promotionResult.value;
    if (error) {
      console.error("[landing] Promotion DB error:", error.message);
    } else if (data) {
      const p = data as any;
      activePromotion = {
        id: String(p.id),
        title: p.title || "",
        description: p.description || "",
        image_url: validateCloudinaryUrl(p.image_url),
        link_url: p.link_url || "/booking",
      };
    }
  } else {
    console.error("[landing] Promotion Promise rejected:", promotionResult.reason);
  }

  // ── Featured group photo ───────────────────────────────────────────────────
  let featuredGroupPhoto: PublicGroupPhoto | null = null;
  if (
    groupPhotoResult.status === "fulfilled" &&
    groupPhotoResult.value.data
  ) {
    const photo = groupPhotoResult.value.data as any;
    const validImageUrl = validateCloudinaryUrl(photo.image_url);

    if (validImageUrl) {
      // Fetch testimonial for this photo (separate — only runs if photo exists)
      const { data: testimonialData } = await supabase
        .from("testimonials")
        .select("name, testimonial_text")
        .eq("group_photo_id", photo.id)
        .eq("is_active", true)
        .eq("is_approved", true)
        .maybeSingle();

      featuredGroupPhoto = {
        id: String(photo.id),
        image_url: validImageUrl,
        alt_text: photo.alt_text || "Group hike photo",
        title: photo.title || "Group Expedition",
        location: photo.location || "Mountain",
        date: photo.photo_date
          ? new Date(photo.photo_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "Date TBD",
        group_type: photo.group_type || "Group hike",
        testimonial: testimonialData
          ? {
              name: testimonialData.name || "Anonymous",
              text: testimonialData.testimonial_text || "",
            }
          : null,
      };
    }
  } else if (groupPhotoResult.status === "rejected") {
    console.error(
      "[landing] Group photo query failed:",
      groupPhotoResult.reason
    );
  }

  return {
    mountains,
    testimonials,
    contentSettings,
    activePromotion,
    featuredGroupPhoto,
  };
}
