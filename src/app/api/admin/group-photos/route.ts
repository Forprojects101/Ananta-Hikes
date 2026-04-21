import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
}

async function ensureAdmin(request: NextRequest, supabase: any) {
  const token = request.cookies.get("auth-token")?.value || request.cookies.get("verified-token")?.value;
  if (!token) return false;

  const { data: user } = await supabase
    .from("users")
    .select("roles(name)")
    .eq("id", token)
    .maybeSingle();

  const rolesData = (user as any)?.roles as { name?: string } | { name?: string } | undefined;
  const roleName = Array.isArray(rolesData) ? (rolesData as any)[0]?.name : (rolesData as any)?.name;
  return roleName === "Admin" || roleName === "Super Admin";
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: photos, error } = await supabase
      .from("group_photos")
      .select("*, mountains:mountain_id(id, name)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ photos: photos || [] });
  } catch (error) {
    console.error("Get group photos error:", error);
    return NextResponse.json({ message: "Failed to fetch group photos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const token = request.cookies.get("auth-token")?.value || request.cookies.get("verified-token")?.value;

    const { data, error } = await supabase
      .from("group_photos")
      .insert([
        {
          image_url: body.image_url,
          alt_text: body.alt_text || null,
          title: body.title,
          location: body.location || null,
          photo_date: body.photo_date || null,
          group_type: body.group_type || null,
          mountain_id: body.mountain_id || null,
          created_by: token,
          is_featured: body.is_featured || false,
          is_active: body.is_active !== false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ photo: data, message: "Photo added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Create group photo error:", error);
    return NextResponse.json({ message: "Failed to add photo" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) throw new Error("Photo ID is required");

    const { data, error } = await supabase
      .from("group_photos")
      .update({
        image_url: body.image_url,
        alt_text: body.alt_text || null,
        title: body.title,
        location: body.location || null,
        photo_date: body.photo_date || null,
        group_type: body.group_type || null,
        mountain_id: body.mountain_id || null,
        is_featured: body.is_featured || false,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ photo: data, message: "Photo updated successfully" });
  } catch (error) {
    console.error("Update group photo error:", error);
    return NextResponse.json({ message: "Failed to update photo" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new Error("Photo ID is required");

    const { error } = await supabase.from("group_photos").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Delete group photo error:", error);
    return NextResponse.json({ message: "Failed to delete photo" }, { status: 500 });
  }
}
