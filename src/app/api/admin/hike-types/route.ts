import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
}

async function ensureAdmin(request: NextRequest, supabase: any) {
  const token = request.cookies.get("auth-token")?.value || request.cookies.get("verified-token")?.value;
  
  console.log("🔐 [ensureAdmin] Checking auth token:", token ? "Present" : "Missing");
  
  if (!token) {
    console.warn("⚠️ [ensureAdmin] No token found in cookies");
    return false;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, role_id, roles(name)")
    .eq("id", token)
    .maybeSingle();

  console.log("🔐 [ensureAdmin] User query result:", { user, error });

  if (error || !user) {
    console.warn("⚠️ [ensureAdmin] User not found or query error:", error);
    return false;
  }

  const roleData = (user as any)?.roles as { name?: string } | undefined;
  const roleName = roleData?.name;
  
  console.log("🔐 [ensureAdmin] User role:", roleName);
  
  const isAdmin = roleName === "Admin" || roleName === "Super Admin";
  console.log("🔐 [ensureAdmin] Is admin:", isAdmin);
  
  return isAdmin;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🏔️ [POST /admin/hike-types] Request received");
    
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      console.warn("⚠️ [POST /admin/hike-types] Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    console.log("📥 [POST /admin/hike-types] Request body:", JSON.stringify(body, null, 2));

    const { mountain_id, name, description, duration, fitness, price, is_active } = body;

    if (!mountain_id) {
      console.warn("⚠️ [POST /admin/hike-types] Mountain ID is required");
      return NextResponse.json({ message: "Mountain ID is required" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      console.warn("⚠️ [POST /admin/hike-types] Hike type name is required");
      return NextResponse.json({ message: "Hike type name is required" }, { status: 400 });
    }

    const payload = {
      mountain_id,
      name: name.trim(),
      description: description ? description.trim() : null,
      duration: duration ? duration.trim() : null,
      fitness: fitness || "Beginner",
      price: price ? Number(price) : 0,
      is_active: is_active !== false,
    };

    console.log("💾 [POST /admin/hike-types] Inserting hike type:", JSON.stringify(payload, null, 2));

    const { data, error } = await supabase
      .from("hike_types")
      .insert([payload])
      .select();

    if (error) {
      console.error("❌ [POST /admin/hike-types] Supabase error:", error);
      return NextResponse.json(
        { message: "Failed to create hike type", error: error.message },
        { status: 500 }
      );
    }

    console.log("✅ [POST /admin/hike-types] Hike type created successfully:", data?.[0]);
    return NextResponse.json(data?.[0], { status: 201 });
  } catch (error) {
    console.error("❌ [POST /admin/hike-types] Catch block error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to create hike type",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
