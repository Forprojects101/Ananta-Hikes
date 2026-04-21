import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyAccessToken, clearRefreshTokenCookie } from "@/lib/auth-secure";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({ message: "Invalid or expired access token" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Delete ALL refresh tokens for this user
    const { error } = await supabase
      .from("refresh_tokens")
      .delete()
      .eq("user_id", payload.userId);

    if (error) {
      console.error("Logout all error:", error);
      return NextResponse.json({ message: "Failed to logout from all devices" }, { status: 500 });
    }

    const response = NextResponse.json({ message: "Logged out from all devices successfully" });
    clearRefreshTokenCookie(response);
    
    return response;
  } catch (error) {
    console.error("Logout all error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
