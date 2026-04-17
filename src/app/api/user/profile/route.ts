import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

async function getSupabaseServerClient() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return supabase;
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();
    const { fullName, phone, address, city, province, isVerified, profileImageUrl } = body;

    // Get user email from the request header or body
    const email = request.headers.get("x-user-email") || body.email;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (fullName) updateData.full_name = fullName;
    if (phone) updateData.phone_number = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (province) updateData.province = province;
    if (typeof isVerified !== 'undefined') updateData.is_verified = isVerified;
    if (profileImageUrl) updateData.profile_image_url = profileImageUrl;

    // Update user profile in database
    const { error, data } = await supabase
      .from("users")
      .update(updateData)
      .eq("email", email)
      .select();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { message: "Failed to update profile" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: data[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const email = request.headers.get("x-user-email");

    if (!email) {
      return NextResponse.json(
        { message: "Email parameter is required" },
        { status: 400 }
      );
    }

    const { error, data } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const email = request.headers.get("x-user-email");

    if (!email) {
      return NextResponse.json(
        { message: "Email parameter is required" },
        { status: 400 }
      );
    }

    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (lookupError || !existingUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("email", email);

    if (error) {
      console.error("Error deleting profile:", error);
      return NextResponse.json(
        { message: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
