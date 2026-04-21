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

  const rolesData = (user as any)?.roles as { name?: string } | { name?: string } | undefined;
  const roleName = Array.isArray(rolesData) ? (rolesData as any)[0]?.name : (rolesData as any)?.name;
  return roleName === "Admin" || roleName === "Super Admin";
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: testimonials, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ testimonials: testimonials || [] });
  } catch (error) {
    console.error("Get testimonials error:", error);
    return NextResponse.json({ message: "Failed to fetch testimonials" }, { status: 500 });
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
      .from("testimonials")
      .insert([
        {
          name: body.name,
          profile_url: body.profile_url || null,
          star_rate: body.star_rate || 5,
          testimonial_text: body.testimonial_text,
          is_active: body.is_active !== false,
          is_approved: body.is_approved !== false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ testimonial: data, message: "Testimonial added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Create testimonial error:", error);
    return NextResponse.json({ message: "Failed to add testimonial" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) throw new Error("Testimonial ID is required");

    const { data, error } = await supabase
      .from("testimonials")
      .update({
        name: body.name,
        profile_url: body.profile_url || null,
        star_rate: body.star_rate || 5,
        testimonial_text: body.testimonial_text,
        is_active: body.is_active,
        is_approved: body.is_approved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ testimonial: data, message: "Testimonial updated successfully" });
  } catch (error) {
    console.error("Update testimonial error:", error);
    return NextResponse.json({ message: "Failed to update testimonial" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new Error("Testimonial ID is required");

    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Delete testimonial error:", error);
    return NextResponse.json({ message: "Failed to delete testimonial" }, { status: 500 });
  }
}
