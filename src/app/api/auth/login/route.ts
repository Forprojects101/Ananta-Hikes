import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { 
  validateAuthInputs, 
  comparePassword, 
  signAccessToken, 
  generateRefreshToken, 
  hashToken, 
  setRefreshTokenCookie,
  insertRefreshToken
} from "@/lib/auth-secure";

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    // 1. Sanitize and Validate Inputs
    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();
    const password = body.password;

    if (!validateAuthInputs(email, password)) {
      return NextResponse.json(
        { message: "Invalid email or password format" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Generic 401 response — never reveal whether the email exists
    const invalidResponse = NextResponse.json(
      { message: "Invalid email or password" },
      { status: 401 }
    );

    // 2. Lookup user — only select columns that exist in your schema
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, profile_image_url, password_hash, status, email_verified, roles(id, name)")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error("❌ [Login] Database error:", userError);
      return invalidResponse;
    }

    if (!user) {
      console.warn(`⚠️ [Login] No user found for email: ${email}`);
      return invalidResponse;
    }

    // 3. Check account status first
    if (user.status !== "active") {
      return NextResponse.json(
        { message: "Account is not active. Please contact support." },
        { status: 403 }
      );
    }

    // 4. Detect Google-only accounts (placeholder hash, no real password)
    if (!user.password_hash) {
      console.warn(`⚠️ [Login] No password set for: ${email}`);
      return NextResponse.json(
        { message: "This account uses Google Sign-In. Please use the 'Continue with Google' button." },
        { status: 401 }
      );
    }

    // 5. Verify password
    console.log(`🔍 [Login] Comparing password for: ${email}`);
    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) {
      console.warn(`❌ [Login] Password mismatch for: ${email}`);
      return invalidResponse;
    }

    console.log(`✅ [Login] Success for: ${email}`);

    // 6. Update last_login timestamp
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    // 7. Generate tokens
    const roleObj = Array.isArray(user.roles) ? user.roles[0] : user.roles;
    const roleName = roleObj?.name || "Hiker";

    const accessToken = signAccessToken({ 
      userId: user.id, 
      role: roleName
    });

    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    // 8. Store refresh token in DB
    const { error: rtError } = await insertRefreshToken(supabase, {
      userId: user.id,
      tokenHash: hashedRefreshToken,
      expiresAt: expiresAt,
      deviceInfo: request.headers.get("user-agent") || undefined,
      ipAddress: request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || undefined,
    });

    if (rtError) {
      console.error("❌ [Login] Refresh token storage error:", rtError);
      return NextResponse.json({ message: "Login failed — session error" }, { status: 500 });
    }

    // 9. Return full user profile for client hydration
    const response = NextResponse.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        profileImageUrl: user.profile_image_url,
        emailVerified: user.email_verified,
        role: roleName,
        roleId: roleObj?.id,
        status: user.status,
      }
    });

    setRefreshTokenCookie(response, refreshToken);
    return response;

  } catch (error) {
    console.error("❌ [Login] Unexpected error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
