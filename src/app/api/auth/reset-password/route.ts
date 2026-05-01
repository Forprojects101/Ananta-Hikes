import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { 
  getVerificationCodeDb, 
  markVerificationCodeUsed
} from "@/lib/auth";
import { hashPassword, validateAuthInputs } from "@/lib/auth-secure";

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!validateAuthInputs(email, newPassword)) {
      return NextResponse.json({ message: "Invalid email or weak password" }, { status: 400 });
    }

    const verificationRecord = await getVerificationCodeDb(email, code, "password_reset");

    if (!verificationRecord) {
      return NextResponse.json({ message: "Invalid or expired reset code" }, { status: 400 });
    }

    if (verificationRecord.is_locked) {
      return NextResponse.json({ message: "Too many attempts. Please request a new code." }, { status: 403 });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password in the database
    const supabase = getSupabaseAdmin();
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("email", email);

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return NextResponse.json({ message: "Failed to reset password" }, { status: 500 });
    }

    // Mark code as used
    await markVerificationCodeUsed(verificationRecord.id);

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ message: "Failed to process request" }, { status: 500 });
  }
}
