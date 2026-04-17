import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Supabase environment variables are not configured");
  }

  const keyToUse = serviceRoleKey || anonKey;
  if (!keyToUse) {
    throw new Error("Supabase key is not configured");
  }

  return createClient(supabaseUrl, keyToUse);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { id: mountainId } = params;

    // Fetch hike types with prices specific to this mountain from the junction table
    const { data: mountainHikeTypes, error } = await supabase
      .from("mountain_hike_types")
      .select("id, hike_type_id, price, hike_types(id, name, description, duration, fitness)")
      .eq("mountain_id", mountainId)
      .order("created_at");

    if (error) {
      console.error("Fetch mountain hike types error:", error);
      return NextResponse.json(
        { message: "Failed to fetch hike types", error: error.message },
        { status: 500 }
      );
    }

    // Map the response to include all necessary fields
    const hikeTypes = mountainHikeTypes?.map((item: any) => ({
      id: item.hike_type_id,
      name: item.hike_types?.name,
      description: item.hike_types?.description,
      duration: item.hike_types?.duration,
      fitness: item.hike_types?.fitness,
      price: item.price,
    })) || [];

    return NextResponse.json({
      hikeTypes: hikeTypes,
      message: "Hike types fetched successfully",
    });
  } catch (error) {
    console.error("Mountain hike types API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
