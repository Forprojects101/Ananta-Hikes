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

async function ensureAdmin(request: NextRequest, supabase: any) {
  const token = request.cookies.get("auth-token")?.value || request.cookies.get("verified-token")?.value;
  if (!token) return false;

  const { data: user } = await supabase
    .from("users")
    .select("roles(name)")
    .eq("id", token)
    .maybeSingle();

  const rolesData = (user as any)?.roles as { name?: string } | { name?: string }[] | undefined;
  const roleName = Array.isArray(rolesData) ? rolesData[0]?.name : rolesData?.name;
  return roleName === "Admin" || roleName === "Super Admin";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();

    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    if (!isUuid(id)) {
      return NextResponse.json({ message: "Invalid ad ID" }, { status: 400 });
    }

    const body = await request.json();

    const payload: Record<string, any> = {};
    if (body.title !== undefined) payload.title = String(body.title).trim();
    if (body.description !== undefined) payload.description = body.description ? String(body.description).trim() : null;
    if (body.image_url !== undefined) payload.image_url = body.image_url ? String(body.image_url).trim() : null;
    if (body.link_url !== undefined) payload.link_url = body.link_url ? String(body.link_url).trim() : null;
    if (body.start_date !== undefined) payload.start_date = body.start_date || null;
    if (body.end_date !== undefined) payload.end_date = body.end_date || null;
    if (body.is_active !== undefined) payload.is_active = body.is_active;

    const { data, error } = await supabase
      .from("promotions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ad: data,
      message: "Ad updated successfully",
    });
  } catch (error) {
    console.error("Update ad error:", error);
    return NextResponse.json(
      { message: "Failed to update ad", error: (error as any).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();

    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    if (!isUuid(id)) {
      return NextResponse.json({ message: "Invalid ad ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("promotions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      message: "Ad deleted successfully",
    });
  } catch (error) {
    console.error("Delete ad error:", error);
    return NextResponse.json(
      { message: "Failed to delete ad", error: (error as any).message },
      { status: 500 }
    );
  }
}
