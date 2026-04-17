import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

function mapUser(row: Record<string, any>) {
  // Handle both array and object forms of roles relationship
  const rolesData = Array.isArray(row.roles) && row.roles[0] ? row.roles[0] : row.roles;
  
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    profileImageUrl: row.profile_image_url,
    emailVerified: row.email_verified,
    verifiedAt: row.verified_at,
    roleId: row.role_id,
    role: rolesData || undefined,
    status: row.status,
    lastLogin: row.last_login,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const token =
      request.cookies.get("auth-token")?.value ||
      request.cookies.get("verified-token")?.value;

    console.log("📝 [/api/auth/me] Token:", token ? "Present" : "Missing");

    if (!token) {
      return NextResponse.json(null, { status: 401 });
    }

    const { data: dbUser, error } = await supabase
      .from("users")
      .select(
        "id,email,full_name,phone,profile_image_url,email_verified,verified_at,role_id,status,last_login,created_at,updated_at,roles(*)"
      )
      .eq("id", token)
      .maybeSingle();

    console.log("📝 [/api/auth/me] Query result:", { 
      userExists: !!dbUser, 
      error: error?.message,
      dbUser: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        role_id: dbUser.role_id,
        roles: dbUser.roles,
        status: dbUser.status
      } : null
    });

    if (error || !dbUser) {
      console.log("❌ [/api/auth/me] User not found or error:", error?.message);
      return NextResponse.json(null, { status: 401 });
    }

    const user = mapUser(dbUser);
    
    console.log("📝 [/api/auth/me] Mapped user:", {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.role,
      status: user.status
    });

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
