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
      .from("hike_types")
      .select("id, name, description, duration, fitness, price, is_active, mountain_id")
      .eq("is_active", true)
      .order("name", { ascending: true });

    // Filter by mountain_id if provided
    if (mountainId) {
      query = query.eq("mountain_id", mountainId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch hike types query error:", error);
      return NextResponse.json({ message: "Failed to fetch hike types from database" }, { status: 500 });
    }

    const hikeTypes = (data || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name || "Hike Type"),
      description: row.description ? String(row.description) : "",
      duration: row.duration ? String(row.duration) : "",
      fitness: row.fitness ? String(row.fitness) : "",
      price: row.price ? Number(row.price) : 0,
      mountain_id: row.mountain_id,
    }));

    return NextResponse.json({ hikeTypes, message: "Hike types fetched successfully" });
  } catch (error) {
    console.error("Fetch hike types error:", error);
    return NextResponse.json({ message: "Failed to fetch hike types" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    const { name, description, duration, fitness, is_active } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Hike type name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("hike_types")
      .insert([
        {
          name: name.trim(),
          description: description || null,
          duration: duration || null,
          fitness: fitness || null,
          is_active: is_active !== false,
        },
      ])
      .select();

    if (error) {
      console.error("Create hike type error:", error);
      return NextResponse.json({ message: "Failed to create hike type", error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      hikeType: data?.[0],
      message: "Hike type created successfully",
    });
  } catch (error) {
    console.error("Create hike type error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    const { id, name, description, duration, fitness, is_active } = body;

    if (!id) {
      return NextResponse.json({ message: "Hike type ID is required" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Hike type name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("hike_types")
      .update({
        name: name.trim(),
        description: description || null,
        duration: duration || null,
        fitness: fitness || null,
        is_active: is_active !== false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Update hike type error:", error);
      return NextResponse.json({ message: "Failed to update hike type", error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      hikeType: data?.[0],
      message: "Hike type updated successfully",
    });
  } catch (error) {
    console.error("Update hike type error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
