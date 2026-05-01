import { NextRequest, NextResponse } from "next/server";
import { getVerificationCodeDb } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ message: "Email and code are required" }, { status: 400 });
    }

    const verificationRecord = await getVerificationCodeDb(email, code, "password_reset");

    if (!verificationRecord) {
      return NextResponse.json({ message: "Invalid or expired reset code" }, { status: 400 });
    }

    if (verificationRecord.is_locked) {
      return NextResponse.json({ message: "Too many attempts. Please request a new code." }, { status: 403 });
    }

    return NextResponse.json({ message: "Code verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Verify reset code error:", error);
    return NextResponse.json({ message: "Failed to process request" }, { status: 500 });
  }
}
