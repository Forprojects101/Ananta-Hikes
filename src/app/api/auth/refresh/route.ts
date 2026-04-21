import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { 
  signAccessToken, 
  generateRefreshToken, 
  hashToken, 
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  insertRefreshToken
} from "@/lib/auth-secure";

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ authenticated: false, message: "No session" }, { status: 200 });
    }

    const supabase = getSupabaseAdmin();
    const hashedToken = hashToken(refreshToken);

    // 1. Validate Refresh Token in DB — check it exists AND hasn't expired
    const { data: rtData, error: rtError } = await supabase
      .from("refresh_tokens")
      .select("id, user_id, expires_at")
      .eq("token_hash", hashedToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (rtError) {
      console.error("❌ [Refresh] DB error:", rtError);
      const response = NextResponse.json({ authenticated: false }, { status: 200 });
      clearRefreshTokenCookie(response);
      return response;
    }

    if (!rtData) {
      // Token not found or expired — could be reuse attack or natural expiry
      console.warn("⚠️ [Refresh] Token not found or expired. Clearing cookie.");
      const response = NextResponse.json({ authenticated: false, message: "Session expired" }, { status: 200 });
      clearRefreshTokenCookie(response);
      return response;
    }

    // 2. Load full user profile for client-side hydration
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, profile_image_url, status, email_verified, roles(id, name)")
      .eq("id", rtData.user_id)
      .single();

    if (userError || !userData) {
      console.error("❌ [Refresh] User lookup failed:", userError);
      const response = NextResponse.json({ authenticated: false }, { status: 200 });
      clearRefreshTokenCookie(response);
      return response;
    }

    if (userData.status !== "active") {
      const response = NextResponse.json({ authenticated: false, message: "Account is inactive" }, { status: 200 });
      clearRefreshTokenCookie(response);
      return response;
    }

    // 3. Token Rotation — delete old token FIRST before issuing new one
    const { error: deleteError } = await supabase
      .from("refresh_tokens")
      .delete()
      .eq("id", rtData.id);

    if (deleteError) {
      console.error("❌ [Refresh] Failed to delete old token:", deleteError);
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }

    // 4. Issue new access token and refresh token
    const roleObj = Array.isArray(userData.roles) ? userData.roles[0] : userData.roles;
    const roleName = roleObj?.name || "Hiker";

    const newAccessToken = signAccessToken({ 
      userId: userData.id, 
      role: roleName 
    });

    const newRefreshToken = generateRefreshToken();
    const newHashedToken = hashToken(newRefreshToken);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: insertError } = await insertRefreshToken(supabase, {
      userId: userData.id,
      tokenHash: newHashedToken,
      expiresAt: expiresAt,
      deviceInfo: request.headers.get("user-agent") || undefined,
      ipAddress: request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || undefined,
    });

    if (insertError) {
      console.error("❌ [Refresh] Failed to store new token:", insertError);
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }

    // 5. Send response with full user data for context hydration
    const response = NextResponse.json({
      accessToken: newAccessToken,
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        profileImageUrl: userData.profile_image_url,
        emailVerified: userData.email_verified,
        role: roleName,
        roleId: roleObj?.id,
      }
    });

    setRefreshTokenCookie(response, newRefreshToken);
    return response;

  } catch (error) {
    console.error("❌ [Refresh] Unexpected error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
