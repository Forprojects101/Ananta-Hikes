import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
}

function isUuid(value: string | undefined) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏔️ [GET /mountains/:id/associations] Request received");
    
    const supabase = getSupabaseServerClient();
    const mountainId = params.id;

    if (!isUuid(mountainId)) {
      console.warn("⚠️ [GET /mountains/:id/associations] Invalid mountain ID format:", mountainId);
      return NextResponse.json({ message: "Invalid mountain ID" }, { status: 400 });
    }

    console.log("📍 [GET /mountains/:id/associations] Mountain ID:", mountainId);

    // Get hike types for this mountain
    console.log("🔍 [GET /mountains/:id/associations] Fetching hike types...");
    const { data: hikeTypes, error: hikeError } = await supabase
      .from("mountain_hike_types")
      .select("hike_type_id, price, hike_types(id, name)")
      .eq("mountain_id", mountainId);

    if (hikeError) {
      console.error("❌ [GET /mountains/:id/associations] Error fetching hike types:", hikeError);
      return NextResponse.json({ message: "Failed to fetch hike types" }, { status: 500 });
    }

    // Get add-ons for this mountain
    console.log("🔍 [GET /mountains/:id/associations] Fetching add-ons...");
    const { data: addOns, error: addOnError } = await supabase
      .from("mountain_add_ons")
      .select("add_on_id, price, add_ons(id, name)")
      .eq("mountain_id", mountainId);

    if (addOnError) {
      console.error("❌ [GET /mountains/:id/associations] Error fetching add-ons:", addOnError);
      return NextResponse.json({ message: "Failed to fetch add-ons" }, { status: 500 });
    }

    const response = {
      hikeTypes: (hikeTypes || []).map((ht: any) => ({
        id: ht.hike_type_id,
        price: ht.price,
      })),
      addOns: (addOns || []).map((ao: any) => ({
        id: ao.add_on_id,
        price: ao.price,
      })),
    };

    console.log("✅ [GET /mountains/:id/associations] Associations fetched successfully:", response);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ [GET /mountains/:id/associations] Catch block error:", error);
    console.error("❌ [GET /mountains/:id/associations] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "No stack",
    });
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to fetch associations",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
