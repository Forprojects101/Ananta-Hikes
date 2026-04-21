import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashToken, clearRefreshTokenCookie } from "@/lib/auth-secure";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (refreshToken) {
      const supabase = getSupabaseAdmin();
      const hashedToken = hashToken(refreshToken);

      // Delete the specific refresh token from DB
      await supabase
        .from("refresh_tokens")
        .delete()
        .eq("token_hash", hashedToken);
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    clearRefreshTokenCookie(response);
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}
