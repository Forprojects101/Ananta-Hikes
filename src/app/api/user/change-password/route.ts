import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword, comparePassword, validateAuthInputs } from "@/lib/auth-secure";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();
    const email = request.headers.get("x-user-email");

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ message: "New password cannot be the same as the current password" }, { status: 400 });
    }

    if (!validateAuthInputs("valid@gmail.com", newPassword)) { // using dummy email just to validate password strength
      return NextResponse.json({ message: "Weak password. Must contain uppercase, lowercase, number and special char." }, { status: 400 });
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

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ message: "Incorrect current password" }, { status: 400 });
    }

    // Update password
    const newHash = await hashPassword(newPassword);
    const { error } = await supabase
      .from("users")
      .update({ password_hash: newHash })
      .eq("email", email);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
