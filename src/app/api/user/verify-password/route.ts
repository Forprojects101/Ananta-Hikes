import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { comparePassword } from "@/lib/auth-secure";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const email = request.headers.get("x-user-email");

    if (!email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: user } = await supabase
      .from("users")
      .select("password_hash")
      .eq("email", email)
      .single();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ message: "Incorrect current password" }, { status: 400 });
    }

    return NextResponse.json({ message: "Password verified" }, { status: 200 });
  } catch (error) {
    console.error("Verify password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
