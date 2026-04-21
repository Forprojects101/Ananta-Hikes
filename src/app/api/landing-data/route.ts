import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient();

    const fetchTime = new Date().toISOString();
    console.log(`📡 [/api/landing-data] Starting fresh fetch at ${fetchTime}`);

    const [
      { data: mountains },
      { data: contentSettings },
      { data: testimonials },
      { count: activeUsersCount },
      { data: activePromotion },
    ] = await Promise.all([
      supabase
        .from("mountains")
        .select("id, name, location, difficulty, elevation_meters, duration_hours, max_participants, image_url, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("content_settings")
        .select("key, value")
        .in("key", ["mountain_selection_heading", "testimonials_heading", "hero_subtitle"]),
      supabase
        .from("testimonials")
        .select("name, profile_url, star_rate, testimonial_text")
        .eq("is_active", true)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    console.log("✅ [/api/landing-data] Successfully fetched:", {
      mountainsCount: mountains?.length || 0,
      contentSettingsCount: contentSettings?.length || 0,
      testimonialsCount: (testimonials as any)?.length || 0,
      activeUsersCount: activeUsersCount || 0
    });

    // Log mountain names for verification
    if (mountains && mountains.length > 0) {
      console.log("📍 [/api/landing-data] Mountains fetched:");
      mountains.forEach((m: any, i: number) => {
        console.log(`  ${i + 1}. ${m.name} - is_active: ${m.is_active}, location: ${m.location}`);
      });
    }

    const response = new NextResponse(
      JSON.stringify({
        mountains: mountains || [],
        contentSettings: contentSettings || [],
        testimonials: testimonials || [],
        activeUsersCount: activeUsersCount || 0,
        activePromotion: activePromotion || null,
        fetchedAt: fetchTime, // Include timestamp in response
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    // **CRITICAL**: Set multiple cache-control headers to prevent any caching
    // Browser cache prevention
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    
    // CDN/Proxy cache prevention
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set("Vary", "Accept-Encoding, Authorization");
    
    // Additional headers
    response.headers.set("ETag", `"${Date.now()}"`); // Force revalidation with timestamp
    response.headers.set("Last-Modified", new Date().toUTCString());

    console.log("✅ [/api/landing-data] Response sent with no-cache headers");

    return response;
  } catch (error) {
    console.error("❌ [/api/landing-data] Error:", error);
    return NextResponse.json({ message: "Failed to fetch landing data" }, { status: 500 });
  }
}
