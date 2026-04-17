import { NextRequest, NextResponse } from "next/server";
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient();
    const hikeTypeId = params.id;
    const body = await request.json();

    const { name, description, duration, fitness, price, is_active } = body;

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
        price: price ? Number(price) : null,
        is_active: is_active !== false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", hikeTypeId)
      .select()
      .single();

    if (error) {
      console.error("Update hike type error:", error);
      return NextResponse.json({ message: "Failed to update hike type", error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update hike type error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient();
    const hikeTypeId = params.id;

    const { error } = await supabase
      .from("hike_types")
      .delete()
      .eq("id", hikeTypeId);

    if (error) {
      console.error("Delete hike type error:", error);
      return NextResponse.json({ message: "Failed to delete hike type", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Hike type deleted successfully" });
  } catch (error) {
    console.error("Delete hike type error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
