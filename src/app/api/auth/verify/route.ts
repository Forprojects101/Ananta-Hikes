import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getVerificationCodeDb,
  markVerificationCodeUsed,
  incrementVerificationAttempts,
} from "@/lib/auth";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: NextRequest) {
  try {
    const { code, email } = await request.json();

    if (!code || !email) {
      return NextResponse.json(
        { message: "Code and email are required" },
        { status: 400 }
      );
    }

    // Get verification code from database
    const verificationCode = await getVerificationCodeDb(email, code);

    if (!verificationCode) {
      // Code not found - could be invalid, expired, or already used
      return NextResponse.json(
        { message: "Invalid or expired verification code. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if code is locked
    if (verificationCode.is_locked) {
      const lockedUntil = new Date(verificationCode.locked_until).getTime();
      if (Date.now() < lockedUntil) {
        const remainingMinutes = Math.ceil((lockedUntil - Date.now()) / 60000);
        return NextResponse.json(
          { message: `Too many failed attempts. Please try again after ${remainingMinutes} minutes.` },
          { status: 429 }
        );
      }
    }

    // Check if code is expired
    const expiresAt = new Date(verificationCode.expires_at).getTime();
    if (Date.now() > expiresAt) {
      return NextResponse.json(
        { message: "Code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Code is valid - mark as used and update user
    await markVerificationCodeUsed(verificationCode.id);

    // Update user's email verification status in database
    const supabase = getSupabaseServerClient();
    
    const { data: user, error: userError } = await supabase
      .from("users")
      .update({
        email_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("email", email)
      .select()
      .single();

    if (userError) {
      console.error("Error updating user verification status:", userError);
      // Don't fail the verification if user update fails
    }

    const responseUser = user || {
      id: verificationCode.user_id || email,
      email,
      emailVerified: true,
      verifiedAt: new Date().toISOString(),
    };

    const res = NextResponse.json(responseUser, { status: 200 });
    res.cookies.set("verified-token", responseUser.id || email, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    console.log(`✅ [EMAIL VERIFIED] Email verified for ${email}`);
    return res;
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Verification failed" },
      { status: 500 }
    );
  }
}
