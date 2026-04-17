import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  const keyToUse = serviceRoleKey || anonKey;
  if (!keyToUse) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    client: createClient(supabaseUrl, keyToUse),
    keyType: serviceRoleKey ? "service_role" : "anon",
  };
}

function withDebugPayload(message: string, debug: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    return { message, debug };
  }
  return { message };
}

function deriveBasePriceFromRow(row: any, mountainIndex?: number) {
  const direct = row?.price;
  
  if (direct !== null && direct !== undefined && direct !== "") {
    const parsed = typeof direct === "string" ? parseFloat(direct) : Number(direct);
    if (Number.isFinite(parsed)) {
      if (mountainIndex !== undefined) {
        console.log(`     Price source [${mountainIndex}]: Direct price field = ₱${parsed}`);
      }
      return parsed;
    }
  }

  const hikeTypes = Array.isArray(row?.hike_types) ? row.hike_types : [];
  if (mountainIndex !== undefined) {
    console.log(`     Price source [${mountainIndex}]: Direct price is invalid, checking hike_types (found ${hikeTypes.length})`);
  }
  
  const prices = hikeTypes
    .map((type: any) => Number(type?.price))
    .filter((value: number) => Number.isFinite(value) && value >= 0);

  if (prices.length > 0) {
    const minPrice = Math.min(...prices);
    if (mountainIndex !== undefined) {
      console.log(`     Price source [${mountainIndex}]: From hike_types, minimum = ₱${minPrice}`);
    }
    return minPrice;
  }

  if (mountainIndex !== undefined) {
    console.log(`     Price source [${mountainIndex}]: NO PRICE FOUND - Using default 0`);
  }
  return 0;
}

export async function GET() {
  try {
    const { client: supabase, keyType } = getSupabaseServerClient();
    const requestTime = new Date().toISOString();

    console.log("🏔️ [GET /api/mountains] Request started");
    console.log(`   Time: ${requestTime}`);
    console.log(`   Key Type: ${keyType}`);

    // First, fetch ALL mountains to see what we have
    const { data: allMountains, error: allError } = await supabase
      .from("mountains")
      .select("id, name, is_active, created_at")
      .order("created_at", { ascending: false });

    console.log("📊 [GET /api/mountains] Total mountains in database:");
    console.log(`   All mountains count: ${allMountains?.length || 0}`);
    
    if (allMountains && allMountains.length > 0) {
      const active = allMountains.filter((m: any) => m.is_active === true);
      const inactive = allMountains.filter((m: any) => m.is_active === false);
      console.log(`   Active (is_active=true): ${active.length}`);
      console.log(`   Inactive (is_active=false): ${inactive.length}`);
      
      console.log("   Details:");
      allMountains.forEach((m: any, i: number) => {
        console.log(`   [${i + 1}] ${m.name} - is_active: ${m.is_active} (ID: ${m.id})`);
      });
      
      if (inactive.length > 0) {
        console.log("⚠️ [GET /api/mountains] FILTERED OUT (is_active=false):");
        inactive.forEach((m: any) => {
          console.log(`   ❌ ${m.name} (ID: ${m.id})`);
        });
      }
    }

    // Now fetch only active mountains
    const { data: mountains, error } = await supabase
      .from("mountains")
      .select("*, hike_types:hike_types(price)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    console.log("📊 [GET /api/mountains] Query result (ACTIVE only):");
    console.log(`   Active mountains found: ${mountains?.length || 0}`);
    console.log(`   Error: ${error ? error.message : "None"}`);

    if (mountains && mountains.length > 0) {
      console.log("\n📋 [Raw data from database]");
      mountains.forEach((m: any, i: number) => {
        console.log(`   [${i + 1}] ${m.name || "NO NAME"}`);
        console.log(`       Raw price field: ${typeof m.price} = ${JSON.stringify(m.price)}`);
        console.log(`       Direct properties: ${JSON.stringify({ 
          id: m.id, 
          price: m.price, 
          is_active: m.is_active 
        })}`);
      });
      console.log("");
    }

    if (error) {
      console.error("❌ [GET /api/mountains] Fetch mountains query error:", error);
      const response = NextResponse.json(
        withDebugPayload("Failed to fetch mountains from database", {
          stage: "query",
          keyType,
          supabase: {
            code: (error as any)?.code,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
            message: (error as any)?.message,
          },
          recommendation:
            keyType === "anon"
              ? "Likely RLS/permission issue. Add a SELECT policy for mountains or set SUPABASE_SERVICE_ROLE_KEY in .env.local."
              : "Check if the mountains table/columns exist and match schema.",
        }),
        { status: 500 }
      );
      
      // Prevent caching of error responses
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      
      return response;
    }

    const normalizedMountains = (mountains || []).map((mountain: any, idx: number) => ({
      id: String(mountain.id),
      name: mountain.name || "Unnamed Mountain",
      location: mountain.location || "",
      difficulty: mountain.difficulty || "Beginner",
      elevation_meters:
        mountain.elevation_meters === null || mountain.elevation_meters === undefined
          ? null
          : typeof mountain.elevation_meters === "string"
            ? parseInt(mountain.elevation_meters, 10)
            : mountain.elevation_meters,
      duration_hours:
        mountain.duration_hours === null || mountain.duration_hours === undefined
          ? null
          : typeof mountain.duration_hours === "string"
            ? parseInt(mountain.duration_hours, 10)
            : mountain.duration_hours,
      max_participants:
        mountain.max_participants === null || mountain.max_participants === undefined
          ? null
          : typeof mountain.max_participants === "string"
            ? parseInt(mountain.max_participants, 10)
            : mountain.max_participants,
      price: deriveBasePriceFromRow(mountain, idx + 1),
      image_url: mountain.image_url || null,
      description: mountain.description || null,
      inclusions: mountain.inclusions || null,
      is_active: Boolean(mountain.is_active),
    }));

    console.group("✅ [GET /api/mountains] Sending normalized mountains:");
    console.log(`   Total count: ${normalizedMountains.length}`);
    normalizedMountains.forEach((m: any, i: number) => {
      console.log(`   [${i + 1}] ${m.name}`);
      console.log(`       ID: ${m.id}`);
      console.log(`       Location: ${m.location}`);
      console.log(`       Difficulty: ${m.difficulty}`);
      console.log(`       Price: ₱${m.price}`);
      console.log(`       Active: ${m.is_active}`);
      console.log(`       Image: ${m.image_url ? "✓" : "✗"}`);
    });
    console.groupEnd();
    console.log("Full response being sent:", { mountains: normalizedMountains });

    const response = NextResponse.json({
      mountains: normalizedMountains,
      message: "Mountains fetched successfully",
    });
    
    // Prevent caching
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Timestamp", requestTime);
    
    return response;
  } catch (error) {
    console.error("❌ [GET /api/mountains] Fetch mountains error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("   Error message:", errorMsg);
    console.error("   Error type:", error?.constructor?.name);
    
    const response = NextResponse.json(
      withDebugPayload("Failed to fetch mountains", {
        stage: "initialization",
        error: errorMsg,
        recommendation:
          "Set NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart dev server.",
      }),
      { status: 500 }
    );
    
    // Prevent caching of error responses
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    
    return response;
  }
}
