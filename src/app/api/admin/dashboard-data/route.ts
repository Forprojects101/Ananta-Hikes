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

// Mock dashboard data (fallback only)
const MOCK_DASHBOARD_DATA = {
  summary: {
    totalUsers: 0,
    activeBookings: 0,
    activeMountains: 0,
    totalRevenue: 0,
  },
  bookings: [],
  recentActivity: [],
  users: [],
  mountains: [],
};

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // If Supabase is not configured, return mock data
    if (!supabase) {
      return NextResponse.json({
        ...MOCK_DASHBOARD_DATA,
        message: "Supabase not configured. Using mock data.",
      });
    }

    // Fetch bookings with user and mountain details
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        start_date,
        end_date,
        participants,
        total_price,
        status,
        created_at,
        users:hiker_id (full_name, email),
        mountains:mountain_id (name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch users with role information
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        phone,
        profile_image_url,
        status,
        created_at,
        roles (name)
      `
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch mountains data
    const { data: mountains, error: mountainsError } = await supabase
      .from("mountains")
      .select(
        `
        id,
        name,
        location,
        difficulty,
        elevation_meters,
        max_participants,
        description,
        is_active,
        created_at
      `
      )
      .eq("is_active", true)
      .order("name");

    // Fetch summary statistics
    const { data: bookingStats } = await supabase
      .from("bookings")
      .select("id, status, total_price");

    const { count: mountainCount } = await supabase
      .from("mountains")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: userCount } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    // Calculate summary stats
    const totalRevenue =
      bookingStats?.reduce((sum: number, b: any) => {
        return b.status === "completed" || b.status === "confirmed"
          ? sum + (b.total_price || 0)
          : sum;
      }, 0) || 0;

    const activeBookings =
      bookingStats?.filter(
        (b: any) =>
          b.status === "pending" ||
          b.status === "approved" ||
          b.status === "confirmed"
      ).length || 0;

    // Fetch recent activity from audit logs with user info
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select(
        `
        action,
        user_id,
        resource_type,
        created_at,
        users:user_id (full_name, email)
      `
      )
      .order("created_at", { ascending: false })
      .limit(10);

    const recentActivity = (auditLogs || []).map((log: any) => {
      const userData = Array.isArray(log.users) ? log.users[0] : log.users;
      let actionLabel = log.action;
      
      // Format action labels for better readability
      if (log.resource_type) {
        actionLabel = `${log.action.replace(/_/g, " ")} - ${log.resource_type}`;
      }

      return {
        action: actionLabel,
        user: userData?.full_name || userData?.email || "System",
        created_at: log.created_at,
      };
    });

    const responseData = {
      summary: {
        totalUsers: userCount || users?.length || 0,
        activeBookings,
        activeMountains: mountainCount || mountains?.length || 0,
        totalRevenue,
      },
      bookings: bookings || [],
      recentActivity,
      users: users || [],
      mountains: mountains || [],
      message: "Dashboard data fetched from database",
    };

    // Check for errors but don't fail completely
    if (bookingsError || usersError || mountainsError) {
      console.warn("Some dashboard data failed to load:", {
        bookingsError,
        usersError,
        mountainsError,
      });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Fetch dashboard data error:", error);
    // Return empty but valid response instead of failing
    return NextResponse.json({
      ...MOCK_DASHBOARD_DATA,
      message: "Error fetching from database",
    });
  }
}
