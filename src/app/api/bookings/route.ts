import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type IncomingBooking = {
	userId?: string;
	mountainId?: string;
	mountainName?: string;
	hikeTypeName?: string;
	participants?: number;
	date?: string;
	totalPrice?: number;
	status?: string;
	referenceNumber?: string;
	customerName?: string;
	customerEmail?: string;
	customerPhone?: string;
	emergencyContact?: string;
	paymentMethod?: string;
	skillLevel?: string;
	addOns?: Array<{ id?: string; name?: string; price?: number; selected?: boolean }>;
};

type CancelBookingRequest = {
	bookingId?: string;
};

function getSupabaseServerClient() {
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

	if (!serviceRoleKey || !supabaseUrl) return null;
	return createClient(supabaseUrl, serviceRoleKey);
}

function mapHikeTypeToDb(value?: string) {
	const normalized = (value || "").toLowerCase();
	if (normalized.includes("multi")) return "Multi-day";
	if (normalized.includes("overnight")) return "Overnight";
	return "Day";
}

function mapStatusForClient(value?: string): "pending" | "approved" | "completed" | "cancelled" {
	if (value === "pending") return "pending";
	if (value === "approved" || value === "confirmed") return "approved";
	if (value === "completed") return "completed";
	if (value === "canceled" || value === "rejected") return "cancelled";
	return "pending";
}

export async function POST(request: Request) {
	try {
		const supabase = getSupabaseServerClient();
		if (!supabase) {
			return NextResponse.json({ message: "Supabase not configured" }, { status: 500 });
		}

		const body = (await request.json()) as IncomingBooking;

		if (!body.userId || !body.mountainId || !body.date) {
			return NextResponse.json({ message: "Missing required booking fields" }, { status: 400 });
		}

		const notesPayload = {
			customerName: body.customerName || null,
			customerEmail: body.customerEmail || null,
		};

		const dbPayload = {
			hiker_id: body.userId,
			mountain_id: body.mountainId,
			hike_type: mapHikeTypeToDb(body.hikeTypeName),
			start_date: body.date,
			end_date: null,
			participants: Math.max(1, Number(body.participants || 1)),
			total_price: Number(body.totalPrice || 0),
			status: "pending",
			reference_number: body.referenceNumber || null,
			customer_phone: body.customerPhone || null,
			emergency_contact: body.emergencyContact || null,
			payment_method: body.paymentMethod || null,
			skill_level: body.skillLevel || null,
			add_ons: body.addOns ? body.addOns : [],
			notes: JSON.stringify(notesPayload),
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from("bookings")
			.insert(dbPayload)
			.select("id, status, created_at")
			.single();

		if (error) {
			return NextResponse.json({ message: error.message }, { status: 500 });
		}

		return NextResponse.json({ message: "Booking saved", booking: data }, { status: 201 });
	} catch (error) {
		console.error("Create booking error:", error);
		return NextResponse.json({ message: "Failed to save booking" }, { status: 500 });
	}
}

export async function GET(request: Request) {
	try {
		const supabase = getSupabaseServerClient();
		if (!supabase) {
			return NextResponse.json({ bookings: [], message: "Supabase not configured" }, { status: 200 });
		}

		const userId = request.headers.get("x-user-id");
		const userEmail = request.headers.get("x-user-email");

		let hikerId = userId || null;
		if (!hikerId && userEmail) {
			const { data: userRow } = await supabase
				.from("users")
				.select("id")
				.eq("email", userEmail)
				.maybeSingle();
			hikerId = userRow?.id || null;
		}

		if (!hikerId) {
			return NextResponse.json({ bookings: [], message: "User identifier is required" }, { status: 200 });
		}

		const { data, error } = await supabase
			.from("bookings")
			.select(
				"id, hike_type, participants, total_price, status, start_date, end_date, reference_number, customer_phone, emergency_contact, payment_method, notes, created_at, mountains:mountain_id(name)"
			)
			.eq("hiker_id", hikerId)
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json({ message: error.message, bookings: [] }, { status: 500 });
		}

		const bookings = (data || []).map((item) => {
			let noteData: Record<string, unknown> = {};
			if (typeof item.notes === "string") {
				try {
					noteData = JSON.parse(item.notes);
				} catch {
					noteData = {};
				}
			}

			const mountainData = Array.isArray(item.mountains) ? item.mountains[0] : item.mountains;

			return {
				id: item.id,
				mountainName: mountainData?.name || "Mountain",
				hikeType: item.hike_type,
				participants: Number(item.participants || 1),
				totalPrice: Number(item.total_price || 0),
				bookingDate: item.created_at ? new Date(item.created_at).toLocaleDateString("en-PH") : "-",
				startDate: item.start_date ? new Date(item.start_date).toLocaleDateString("en-PH") : "-",
				endDate: item.end_date ? new Date(item.end_date).toLocaleDateString("en-PH") : "-",
				status: mapStatusForClient(item.status),
				referenceNumber: item.reference_number || (noteData.referenceNumber as string) || undefined,
				customerName: (noteData.customerName as string) || undefined,
				customerEmail: (noteData.customerEmail as string) || undefined,
				customerPhone: item.customer_phone || (noteData.customerPhone as string) || undefined,
				emergencyContact: item.emergency_contact || (noteData.emergencyContact as string) || undefined,
				paymentMethod: item.payment_method || (noteData.paymentMethod as string) || undefined,
			};
		});

		return NextResponse.json({ bookings }, { status: 200 });
	} catch (error) {
		console.error("Fetch bookings error:", error);
		return NextResponse.json({ bookings: [], message: "Failed to fetch bookings" }, { status: 500 });
	}
}

export async function PATCH(request: Request) {
	try {
		const supabase = getSupabaseServerClient();
		if (!supabase) {
			return NextResponse.json({ message: "Supabase not configured" }, { status: 500 });
		}

		const body = (await request.json()) as CancelBookingRequest;
		const bookingId = body.bookingId;

		if (!bookingId) {
			return NextResponse.json({ message: "Booking ID is required" }, { status: 400 });
		}

		const userId = request.headers.get("x-user-id");
		const userEmail = request.headers.get("x-user-email");

		let hikerId = userId || null;
		if (!hikerId && userEmail) {
			const { data: userRow } = await supabase
				.from("users")
				.select("id")
				.eq("email", userEmail)
				.maybeSingle();
			hikerId = userRow?.id || null;
		}

		if (!hikerId) {
			return NextResponse.json({ message: "User identifier is required" }, { status: 400 });
		}

		const { data: booking, error: bookingError } = await supabase
			.from("bookings")
			.select("id, hiker_id, status")
			.eq("id", bookingId)
			.maybeSingle();

		if (bookingError || !booking) {
			return NextResponse.json({ message: "Booking not found" }, { status: 404 });
		}

		if (booking.hiker_id !== hikerId) {
			return NextResponse.json({ message: "You are not allowed to cancel this booking" }, { status: 403 });
		}

		if (booking.status !== "pending") {
			return NextResponse.json(
				{ message: "Only pending bookings can be cancelled" },
				{ status: 409 }
			);
		}

		const now = new Date().toISOString();
		const { data: updatedBooking, error: updateError } = await supabase
			.from("bookings")
			.update({
				status: "canceled",
				cancellation_reason: "Cancelled by user",
				canceled_at: now,
				updated_at: now,
			})
			.eq("id", bookingId)
			.select("id, status")
			.single();

		if (updateError || !updatedBooking) {
			return NextResponse.json({ message: "Failed to cancel booking" }, { status: 500 });
		}

		return NextResponse.json(
			{
				message: "Booking cancelled successfully",
				booking: {
					id: updatedBooking.id,
					status: mapStatusForClient(updatedBooking.status),
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Cancel booking error:", error);
		return NextResponse.json({ message: "Failed to cancel booking" }, { status: 500 });
	}
}
