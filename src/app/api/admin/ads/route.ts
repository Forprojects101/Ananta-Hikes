import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: ads, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      ads: ads || [],
      message: "Ads fetched successfully",
    });
  } catch (error) {
    console.error("Get ads error:", error);
    return NextResponse.json(
      { message: "Failed to fetch ads", error: (error as any).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("promotions")
      .insert([
        {
          title: String(body.title || "").trim(),
          description: body.description ? String(body.description).trim() : null,
          image_url: body.image_url ? String(body.image_url).trim() : null,
          link_url: body.link_url ? String(body.link_url).trim() : null,
          start_date: body.start_date || null,
          end_date: body.end_date || null,
          is_active: body.is_active !== false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { ad: data, message: "Ad created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create ad error:", error);
    return NextResponse.json(
      { message: "Failed to create ad", error: (error as any).message },
      { status: 500 }
    );
  }
}
