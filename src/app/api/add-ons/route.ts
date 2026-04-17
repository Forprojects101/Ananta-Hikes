import { NextResponse, NextRequest } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const mountainId = searchParams.get("mountain_id");

    let query = supabase
      .from("add_ons")
      .select("id, name, description, price, is_active, mountain_id")
      .eq("is_active", true)
      .order("name", { ascending: true });

    // Filter by mountain_id if provided
    if (mountainId) {
      query = query.eq("mountain_id", mountainId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch add-ons query error:", error);
      return NextResponse.json({ message: "Failed to fetch add-ons from database" }, { status: 500 });
    }

    const addOns = (data || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name || "Add-on"),
      description: row.description ? String(row.description) : "",
      price: row.price ? Number(row.price) : 0,
      mountain_id: row.mountain_id,
    }));

    return NextResponse.json({ addOns, message: "Add-ons fetched successfully" });
  } catch (error) {
    console.error("Fetch add-ons error:", error);
    return NextResponse.json({ message: "Failed to fetch add-ons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    const { name, description, is_active } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Add-on name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("add_ons")
      .insert([
        {
          name: name.trim(),
          description: description || null,
          is_active: is_active !== false,
        },
      ])
      .select();

    if (error) {
      console.error("Create add-on error:", error);
      return NextResponse.json({ message: "Failed to create add-on", error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      addOn: data?.[0],
      message: "Add-on created successfully",
    });
  } catch (error) {
    console.error("Create add-on error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    const { id, name, description, is_active } = body;

    if (!id) {
      return NextResponse.json({ message: "Add-on ID is required" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Add-on name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("add_ons")
      .update({
        name: name.trim(),
        description: description || null,
        is_active: is_active !== false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Update add-on error:", error);
      return NextResponse.json({ message: "Failed to update add-on", error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      addOn: data?.[0],
      message: "Add-on updated successfully",
    });
  } catch (error) {
    console.error("Update add-on error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
