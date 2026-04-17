import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  hashPassword, 
  isValidEmailDomain, 
  generateVerificationCode,
  sendVerificationEmail,
  storeVerificationCodeDb,
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
    const { email, name, password } = await request.json();
    const supabase = getSupabaseServerClient();

    // Validate input
    if (!email || !name || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!isValidEmailDomain(email)) {
      return NextResponse.json(
        { message: "Only @gmail.com and @yahoo.com emails are allowed" },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { message: "Email is already registered" },
        { status: 409 }
      );
    }

    const { data: hikerRole, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "Hiker")
      .single();

    let resolvedRoleId = hikerRole?.id;
    if (roleError || !hikerRole) {
      const { data: createdRole, error: createRoleError } = await supabase
        .from("roles")
        .insert({
          name: "Hiker",
          description: "Regular user who books hikes",
          hierarchy_level: 1,
          can_manage_users: false,
          can_manage_content: false,
          can_manage_mountains: false,
          can_assign_guides: false,
          can_approve_bookings: false,
          can_override_bookings: false,
          can_access_logs: false,
          can_access_settings: false,
          can_access_admin: false,
          is_active: true,
        })
        .select("id")
        .single();

      if (createRoleError || !createdRole) {
        console.error("Role setup error:", createRoleError || roleError);
        return NextResponse.json(
          { message: "Default role not found. Run SQL schema setup first." },
          { status: 500 }
        );
      }

      resolvedRoleId = createdRole.id;
    }

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: hashPassword(password),
        full_name: name,
        email_verified: false,
        role_id: resolvedRoleId,
        status: "active",
      })
      .select(
        "id,email,full_name,phone,profile_image_url,email_verified,verified_at,role_id,status,last_login,created_at,updated_at,roles(*)"
      )
      .single();
    
    console.log("🔐 [/api/auth/signup] User created:", { email, roleId: insertedUser?.role_id, roleData: insertedUser?.roles });

    if (insertError || !insertedUser) {
      console.error("Signup insert error:", insertError);
      return NextResponse.json(
        { message: "Failed to create account" },
        { status: 500 }
      );
    }
    const newUser = mapUser(insertedUser);

    // Generate and store verification code in database
    try {
      const verificationCode = generateVerificationCode();
      await storeVerificationCodeDb(email, verificationCode);
      
      // Send verification email
      await sendVerificationEmail(email, verificationCode);
      console.log(`✅ [/api/auth/signup] Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email during signup:", emailError);
      // Don't fail signup if email fails, user can resend later
    }

    // Set cookie for session
    const res = NextResponse.json(newUser, { status: 201 });
    res.cookies.set("auth-token", newUser.id, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Signup failed" },
      { status: 500 }
    );
  }
}
