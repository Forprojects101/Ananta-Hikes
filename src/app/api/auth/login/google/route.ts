import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashPassword, isValidEmailDomain } from "@/lib/auth";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
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
    const { email, fullName, avatarUrl } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    if (!isValidEmailDomain(email)) {
      return NextResponse.json(
        { message: "Only @gmail.com and @yahoo.com emails are allowed" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const selectFields =
      "id,email,full_name,phone,profile_image_url,email_verified,verified_at,role_id,status,last_login,created_at,updated_at,roles(*)";

    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select(selectFields)
      .eq("email", email)
      .maybeSingle();

    const nowIso = new Date().toISOString();
    let userRow = existingUser;

    if (findError) {
      console.error("Google login user lookup error:", findError);
      return NextResponse.json({ message: "Google login failed" }, { status: 500 });
    }

    if (!userRow) {
      const { data: hikerRole, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "Hiker")
        .single();

      let roleId = hikerRole?.id;

      if (roleError || !hikerRole?.id) {
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

        if (createRoleError || !createdRole?.id) {
          return NextResponse.json(
            { message: "Default role not found. Run SQL schema setup first." },
            { status: 500 }
          );
        }

        roleId = createdRole.id;
      }

      const { data: insertedUser, error: insertError } = await supabase
        .from("users")
        .insert({
          email,
          password_hash: hashPassword(crypto.randomUUID()),
          full_name: fullName || email.split("@")[0],
          profile_image_url: avatarUrl || null,
          email_verified: true,
          verified_at: nowIso,
          role_id: roleId,
          status: "active",
          last_login: nowIso,
        })
        .select(selectFields)
        .single();

      if (insertError || !insertedUser) {
        console.error("Google login insert error:", insertError);
        return NextResponse.json({ message: "Failed to create Google account" }, { status: 500 });
      }

      userRow = insertedUser;
    } else {
      const updates: Record<string, any> = { last_login: nowIso };

      if (!userRow.email_verified) {
        updates.email_verified = true;
        updates.verified_at = nowIso;
      }

      if (!userRow.full_name && fullName) {
        updates.full_name = fullName;
      }

      if (!userRow.profile_image_url && avatarUrl) {
        updates.profile_image_url = avatarUrl;
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userRow.id)
        .select(selectFields)
        .single();

      if (updateError || !updatedUser) {
        console.error("Google login update error:", updateError);
        return NextResponse.json({ message: "Failed to update account" }, { status: 500 });
      }

      userRow = updatedUser;
    }

    const user = mapUser(userRow);

    const response = NextResponse.json(user, { status: 200 });
    response.cookies.set("auth-token", user.id, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Google login error:", error);
    return NextResponse.json({ message: "Google login failed" }, { status: 500 });
  }
}
