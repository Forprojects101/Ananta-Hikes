import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/auth-secure";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const email = "admin1@gmail.com";
    const newPassword = "Password123!";
    
    const hashedPassword = await hashPassword(newPassword);
    
    const { error } = await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("email", email);
      
    if (error) throw error;
    
    return NextResponse.json({ 
      message: `Successfully reset password for ${email}. New password is: ${newPassword}`,
      note: "PLEASE DELETE THIS FILE (/api/debug/reset-admin) IMMEDIATELY AFTER USE!"
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
