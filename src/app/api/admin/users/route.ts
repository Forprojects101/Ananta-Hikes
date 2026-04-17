import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/auth";

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

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const fullName = String(body?.fullName || "").trim();
    const roleName = String(body?.roleName || "Hiker").trim();
    const password = String(body?.password || "TempPass123!").trim();

    if (!email || !fullName) {
      return NextResponse.json({ message: "Email and full name are required" }, { status: 400 });
    }

    const { data: role } = await supabase
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .maybeSingle();

    if (!role?.id) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        full_name: fullName,
        role_id: role.id,
        status: "active",
        email_verified: false,
        password_hash: hashPassword(password),
      })
      .select("id, email, full_name, status, created_at, roles!users_role_id_fkey(name)")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ message: "Failed to create user" }, { status: 500 });
  }
}
