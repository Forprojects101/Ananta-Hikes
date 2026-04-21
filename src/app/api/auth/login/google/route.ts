import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { 
  signAccessToken, 
  generateRefreshToken, 
  setRefreshTokenCookie,
  hashToken,
  hashPassword,
  insertRefreshToken
} from "@/lib/auth-secure";

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, avatarUrl } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Check if user exists
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, full_name, profile_image_url, status, email_verified, roles(id, name)")
      .eq("email", email)
      .maybeSingle();

    if (findError) {
      console.error("❌ [Google Login] Find error:", findError);
      return NextResponse.json({ message: "Database lookup failed" }, { status: 500 });
    }

    let currentUser = user;

    if (!user) {
      // 2. Create new user for first-time Google sign-in
      const { data: hikerRole, error: roleError } = await supabase
        .from("roles")
        .select("id, name")
        .eq("name", "Hiker")
        .single();

      if (roleError || !hikerRole) {
        console.error("❌ [Google Login] Hiker role not found:", roleError);
        return NextResponse.json({ message: "Default role not configured" }, { status: 500 });
      }

      // Generate a random, non-guessable password hash so the NOT NULL DB
      // constraint is satisfied. The plaintext is never stored and can never
      // be used to log in — Google users must always authenticate via OAuth.
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const placeholderHash = await hashPassword(randomPassword);

      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          email,
          password_hash: placeholderHash,
          full_name: fullName || email.split("@")[0],
          profile_image_url: avatarUrl || null,
          email_verified: true,
          verified_at: new Date().toISOString(),
          role_id: hikerRole.id,
          status: "active",
        })
        .select("id, email, full_name, profile_image_url, status, email_verified, roles(id, name)")
        .single();

      if (insertError) {
        console.error("❌ [Google Login] Insert error:", insertError);
        return NextResponse.json({ message: "Failed to create user account" }, { status: 500 });
      }
      currentUser = newUser;
      console.log(`✅ [Google Login] New user created: ${email}`);
    } else {
      // 3. Update existing user's avatar and login timestamp
      const updates: Record<string, unknown> = { 
        last_login: new Date().toISOString() 
      };
      if (avatarUrl) updates.profile_image_url = avatarUrl;
      if (fullName && !user.full_name) updates.full_name = fullName;
      
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select("id, email, full_name, profile_image_url, status, email_verified, roles(id, name)")
        .single();
      
      currentUser = updateError ? user : updatedUser;
      console.log(`✅ [Google Login] Existing user logged in: ${email}`);
    }

    if (!currentUser) {
      return NextResponse.json({ message: "Failed to resolve user account" }, { status: 500 });
    }

    if (currentUser.status !== "active") {
      return NextResponse.json({ message: "Account is inactive" }, { status: 403 });
    }

    // 4. Generate Tokens
    const roleObj = Array.isArray(currentUser.roles) ? currentUser.roles[0] : currentUser.roles;
    const roleName = roleObj?.name || "Hiker";

    const accessToken = signAccessToken({ userId: currentUser.id, role: roleName });
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    // 5. Store hashed refresh token in DB (device columns optional)
    const { error: rtError } = await insertRefreshToken(supabase, {
      userId: currentUser.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: expiresAt,
      deviceInfo: request.headers.get("user-agent") || undefined,
      ipAddress: request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || undefined,
    });

    if (rtError) {
      console.error("❌ [Google Login] Refresh token storage error:", rtError);
      return NextResponse.json({ message: "Failed to establish session" }, { status: 500 });
    }

    // 6. Return full user profile for client hydration
    const response = NextResponse.json({
      accessToken,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        fullName: currentUser.full_name,
        profileImageUrl: avatarUrl || currentUser.profile_image_url,
        emailVerified: currentUser.email_verified,
        role: roleName,
        roleId: roleObj?.id,
        status: currentUser.status,
      }
    });

    setRefreshTokenCookie(response, refreshToken);
    return response;

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ [Google Login] Unexpected error:", message);
    return NextResponse.json({ 
      message: "Google login failed",
      details: process.env.NODE_ENV === "development" ? message : undefined
    }, { status: 500 });
  }
}
