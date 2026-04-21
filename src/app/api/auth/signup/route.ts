import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { 
  hashPassword, 
  validateAuthInputs 
} from "@/lib/auth-secure";
import { 
  generateVerificationCode,
  sendVerificationEmail,
  storeVerificationCodeDb,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();
    
    if (!validateAuthInputs(email, password) || !name) {
      return NextResponse.json(
        { message: "Invalid input fields" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { message: "Email is already registered" },
        { status: 409 }
      );
    }

    const { data: hikerRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "Hiker")
      .single();

    if (!hikerRole) {
      return NextResponse.json(
        { message: "System error: Default role not found" },
        { status: 500 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: hashedPassword,
        full_name: name,
        email_verified: false,
        role_id: hikerRole.id,
        status: "active",
      })
      .select("id, email")
      .single();

    if (insertError || !insertedUser) {
      console.error("Signup insert error:", insertError);
      return NextResponse.json(
        { message: "Failed to create account" },
        { status: 500 }
      );
    }

    // Verification Flow
    try {
      const verificationCode = generateVerificationCode();
      await storeVerificationCodeDb(email, verificationCode);
      await sendVerificationEmail(email, verificationCode);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json(
      { message: "Account created. Please verify your email." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Signup failed" },
      { status: 500 }
    );
  }
}
