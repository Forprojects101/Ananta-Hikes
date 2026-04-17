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

    // Fetch add-ons with prices specific to this mountain from the junction table
    const { data: mountainAddOns, error } = await supabase
      .from("mountain_add_ons")
      .select("id, add_on_id, price, add_ons(id, name, description)")
      .eq("mountain_id", mountainId)
      .order("created_at");

    if (error) {
      console.error("Fetch mountain add-ons error:", error);
      return NextResponse.json(
        { message: "Failed to fetch add-ons", error: error.message },
        { status: 500 }
      );
    }

    // Map the response to include all necessary fields
    const addOns = mountainAddOns?.map((item: any) => ({
      id: item.add_on_id,
      name: item.add_ons?.name,
      description: item.add_ons?.description,
      price: item.price,
    })) || [];

    return NextResponse.json({
      addOns: addOns,
      message: "Add-ons fetched successfully",
    });
  } catch (error) {
    console.error("Mountain add-ons API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
