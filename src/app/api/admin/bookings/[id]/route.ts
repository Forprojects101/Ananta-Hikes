import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingApprovalEmail } from "@/lib/email";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
}

async function ensureAdmin(request: NextRequest, supabase: any) {
  const token = request.cookies.get("auth-token")?.value || request.cookies.get("verified-token")?.value;
  if (!token) return false;

  const { data: user } = await supabase
    .from("users")
    .select("roles(name)")
    .eq("id", token)
    .maybeSingle();

  const rolesData = (user as any)?.roles as { name?: string } | { name?: string }[] | undefined;
  const roleName = Array.isArray(rolesData) ? rolesData[0]?.name : rolesData?.name;
  return roleName === "Admin" || roleName === "Super Admin";
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const token = request.cookies.get("auth-token")?.value || request.cookies.get("verified-token")?.value;
    const body = await request.json();
    const status = String(body?.status || "");

    if (!status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status };
    if (body.guide_id) updates.guide_id = String(body.guide_id);

    if (status === "approved") {
      updates.approved_by = token;
      updates.approval_date = new Date().toISOString();
    }

    if (status === "rejected" || status === "canceled") {
      updates.canceled_at = new Date().toISOString();
      updates.cancellation_reason = body?.reason ? String(body.reason) : null;
    }

    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", params.id)
      .select("id, hike_type, start_date, participants, total_price, status, notes, add_ons, users!bookings_hiker_id_fkey(full_name, email), mountains!bookings_mountain_id_fkey(name)")
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    // Send approval email if booking is approved
    if (status === "approved" && data) {
      try {
        const hikerData = Array.isArray(data.users) ? data.users[0] : data.users;
        const mountainData = Array.isArray(data.mountains) ? data.mountains[0] : data.mountains;
        const userEmail = hikerData?.email;

        if (userEmail) {
          // Parse notes to get booking details
          let noteData: any = {};
          if (typeof data.notes === "string") {
            try {
              noteData = JSON.parse(data.notes);
            } catch {
              noteData = {};
            }
          }

          // Format date for email
          const bookingDate = new Date(data.start_date).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          // Format add-ons
          let addOnsString = "None";
          if (Array.isArray(data.add_ons) && data.add_ons.length > 0) {
            const selectedNames = data.add_ons
              .filter((a: any) => (typeof a === "object" ? a.selected !== false : true))
              .map((a: any) => (typeof a === "object" ? a.name : a))
              .filter(Boolean);
            if (selectedNames.length > 0) {
              addOnsString = selectedNames.join(", ");
            }
          }

          // Send approval email
          await sendBookingApprovalEmail(userEmail, {
            bookingId: data.id,
            referenceNumber: noteData.referenceNumber || data.id,
            mountainName: mountainData?.name || "Mountain",
            hikeType: data.hike_type || "Hike",
            addOns: addOnsString,
            date: bookingDate,
            participants: data.participants || 1,
            totalPrice: parseFloat(data.total_price) || 0,
            customerName: hikerData?.full_name || noteData.customerName,
          });
        }
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the booking update if email fails
      }
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ message: "Failed to update booking" }, { status: 500 });
  }
}
