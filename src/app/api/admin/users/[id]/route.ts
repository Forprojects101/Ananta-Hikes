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

  const rolesData = (user as any)?.roles as { name?: string } | { name?: string }[] | undefined;
  const roleName = Array.isArray(rolesData) ? rolesData[0]?.name : rolesData?.name;
  return roleName === "Admin" || roleName === "Super Admin";
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body?.fullName === "string") updates.full_name = body.fullName.trim();
    if (typeof body?.status === "string") updates.status = body.status;

    if (typeof body?.roleName === "string") {
      const { data: role } = await supabase.from("roles").select("id").eq("name", body.roleName).maybeSingle();
      if (!role?.id) {
        return NextResponse.json({ message: "Invalid role" }, { status: 400 });
      }
      updates.role_id = role.id;
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", params.id)
      .select("id, email, full_name, status, created_at, roles!users_role_id_fkey(name)")
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase.from("users").delete().eq("id", params.id);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
  }
}
