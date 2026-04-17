import { NextRequest, NextResponse } from "next/server";
import {
  isValidEmailDomain,
  generateVerificationCode,
  sendVerificationEmail,
  storeVerificationCodeDb,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email domain
    if (!isValidEmailDomain(email)) {
      return NextResponse.json(
        {
          message:
            "Only @gmail.com and @yahoo.com emails are allowed",
        },
        { status: 400 }
      );
    }

    // Generate new verification code
    const code = generateVerificationCode();
    
    // Store in database
    await storeVerificationCodeDb(email, code);
    
    // Send verification email
    await sendVerificationEmail(email, code);

    return NextResponse.json(
      { message: "Verification code sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend code error:", error);
    return NextResponse.json(
      { message: "Failed to resend code" },
      { status: 500 }
    );
  }
}
