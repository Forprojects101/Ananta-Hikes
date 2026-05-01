import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { generateVerificationCode, storeVerificationCodeDb } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if user exists
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      // Do not reveal that the user does not exist, just return success
      return NextResponse.json({ message: "If your email is registered, you will receive a reset code." }, { status: 200 });
    }

    // Generate code and send email
    const resetCode = generateVerificationCode();
    await storeVerificationCodeDb(email, resetCode, "password_reset");
    await sendPasswordResetEmail(email, resetCode);

    return NextResponse.json({ message: "Reset code sent! Please check your email." }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Failed to process request" }, { status: 500 });
  }
}
