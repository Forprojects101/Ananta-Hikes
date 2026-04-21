import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json({
        bookings: [],
        message: "Supabase not configured",
      });
    }

    // Fetch all bookings with user and mountain details
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        hike_type,
        start_date,
        end_date,
        participants,
        total_price,
        status,
        cancellation_reason,
        canceled_at,
        completed_at,
        approval_date,
        notes,
        created_at,
        updated_at,
        customer_phone,
        emergency_contact,
        payment_method,
        skill_level,
        add_ons,
        reference_number,
        users:hiker_id (full_name, email),
        mountains:mountain_id (name),
        guides:guide_id (full_name, email),
        approvers:approved_by (full_name, email),
        joiners:joiner (id, status, participants)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      return NextResponse.json(
        { message: "Failed to fetch bookings", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookings: bookings || [],
      message: "Bookings fetched successfully",
    });
  } catch (error) {
    console.error("Bookings API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { message: "Supabase not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, status, notes } = body;

    // Update booking status
    const { data, error } = await supabase
      .from("bookings")
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating booking:", error);
      return NextResponse.json(
        { message: "Failed to update booking", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      booking: data?.[0],
      message: "Booking updated successfully",
    });
  } catch (error) {
    console.error("Bookings PATCH error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
