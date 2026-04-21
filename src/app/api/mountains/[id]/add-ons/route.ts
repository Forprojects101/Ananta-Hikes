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

    // Fetch add-ons directly from the add_ons table for this mountain
    const { data: addOns, error } = await supabase
      .from("add_ons")
      .select("id, name, description, price")
      .eq("mountain_id", mountainId)
      .eq("is_active", true)
      .order("created_at");

    if (error) {
      console.error("Fetch mountain add-ons error:", error);
      return NextResponse.json(
        { message: "Failed to fetch add-ons", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      addOns: addOns || [],
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
