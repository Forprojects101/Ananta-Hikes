import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    // Basic validation
    if (!body.name || !body.testimonial_text || !body.star_rate) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Verify if the user has a completed booking for this trip (optional but good)
    if (body.booking_id) {
        const { data: booking, error: bError } = await supabase
            .from("bookings")
            .select("status, hiker_id")
            .eq("id", body.booking_id)
            .single();
        
        if (bError || !booking || booking.status !== "completed") {
            return NextResponse.json({ message: "Only completed trips can be reviewed" }, { status: 403 });
        }
    }

    const { data, error } = await supabase
      .from("testimonials")
      .insert([
        {
          name: body.name,
          profile_url: body.profile_url || null,
          star_rate: body.star_rate,
          testimonial_text: body.testimonial_text,
          user_id: body.user_id || null,
          booking_id: body.booking_id || null,
          is_active: true,
          is_approved: false, // Moderation required
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }
    return NextResponse.json({ testimonial: data, message: "Thank you for your feedback! It will be visible after review." }, { status: 201 });
  } catch (error: any) {
    console.error("Submit testimonial error:", error);
    return NextResponse.json({ message: error.message || "Failed to submit review" }, { status: 500 });
  }
}
