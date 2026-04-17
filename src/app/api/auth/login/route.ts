import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isValidEmailDomain,
  verifyPassword,
} from "@/lib/auth";

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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const supabase = getSupabaseServerClient();

    // Validate email
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email domain
    if (!isValidEmailDomain(email)) {
      return NextResponse.json(
        {
          message:
            "Only @gmail.com and @yahoo.com emails are allowed",
        },
        { status: 400 }
      );
    }

    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select(
        "id,email,password_hash,full_name,phone,profile_image_url,email_verified,verified_at,role_id,status,last_login,created_at,updated_at,roles(*)"
      )
      .eq("email", email)
      .maybeSingle();
    
    console.log("🔐 [/api/auth/login] User found:", { email, roleData: dbUser?.roles, roleId: dbUser?.role_id });

    if (userError || !dbUser) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, dbUser.password_hash)) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { data: updatedUser } = await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", dbUser.id)
      .select(
        "id,email,full_name,phone,profile_image_url,email_verified,verified_at,role_id,status,last_login,created_at,updated_at,roles(*)"
      )
      .single();
    
    console.log("🔐 [/api/auth/login] Updated user:", { 
      email, 
      roleData: (updatedUser || dbUser)?.roles,
      roleId: (updatedUser || dbUser)?.role_id,
      status: (updatedUser || dbUser)?.status
    });

    const user = mapUser(updatedUser || dbUser);

    // Set cookie
    const res = NextResponse.json(user, { status: 200 });
    res.cookies.set("auth-token", user.id, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    );
  }
}
