import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-me"
);

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
}

function isUuid(value: string | undefined) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function ensureAdmin(request: NextRequest, supabase: any) {
  try {
    const authHeader = request.headers.get("Authorization");
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    
    if (!accessToken) {
      console.warn("⚠️ [ensureAdmin] No access token found in headers");
      return false;
    }

    const { payload } = await jwtVerify(accessToken, JWT_SECRET);
    const roleName = payload.role as string;
    
    console.log("🔐 [ensureAdmin] User role from JWT:", roleName);
    
    const isAdmin = roleName === "Admin" || roleName === "Super Admin";
    return isAdmin;
  } catch (err) {
    console.warn("⚠️ [ensureAdmin] Token verification failed:", err);
    return false;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏔️ [PATCH /mountains/:id] Request received");

    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      console.warn("⚠️ [PATCH /mountains/:id] Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const mountainId = params.id;
    if (!isUuid(mountainId)) {
      console.warn("⚠️ [PATCH /mountains/:id] Invalid mountain ID:", mountainId);
      return NextResponse.json({ message: "Invalid mountain ID" }, { status: 400 });
    }

    const body = await request.json();
    console.log("📥 [PATCH /mountains/:id] Request body:", JSON.stringify(body, null, 2));

    // Build update payload
    const updatePayload: Record<string, any> = {};

    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.description !== undefined) updatePayload.description = body.description?.trim() || null;
    if (body.location !== undefined) updatePayload.location = body.location?.trim() || null;
    if (body.difficulty !== undefined) updatePayload.difficulty = body.difficulty || null;
    if (body.elevationMeters !== undefined) updatePayload.elevation_meters = body.elevationMeters ? Number(body.elevationMeters) : null;
    if (body.maxParticipants !== undefined) updatePayload.max_participants = body.maxParticipants ? Number(body.maxParticipants) : null;
    if (body.inclusions !== undefined) {
      updatePayload.inclusions = body.inclusions ? [String(body.inclusions).trim()] : null;
    }
    if (body.isActive !== undefined) updatePayload.is_active = body.isActive;
    if (body.imageUrl !== undefined) updatePayload.image_url = body.imageUrl || null;

    console.log("💾 [PATCH /mountains/:id] Update payload:", JSON.stringify(updatePayload, null, 2));

    // Update mountain
    const { data, error } = await supabase
      .from("mountains")
      .update(updatePayload)
      .eq("id", mountainId)
      .select()
      .single();

    if (error) {
      console.error("❌ [PATCH /mountains/:id] Update error:", error);
      return NextResponse.json(
        { message: "Failed to update mountain", error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.warn("⚠️ [PATCH /mountains/:id] Mountain not found:", mountainId);
      return NextResponse.json({ message: "Mountain not found" }, { status: 404 });
    }

    console.log("✅ [PATCH /mountains/:id] Mountain updated successfully:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("❌ [PATCH /mountains/:id] Catch block error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to update mountain",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🗑️ [DELETE /mountains/:id] Request received");

    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      console.warn("⚠️ [DELETE /mountains/:id] Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const mountainId = params.id;
    if (!isUuid(mountainId)) {
      console.warn("⚠️ [DELETE /mountains/:id] Invalid mountain ID:", mountainId);
      return NextResponse.json({ message: "Invalid mountain ID" }, { status: 400 });
    }

    console.log("📍 [DELETE /mountains/:id] Mountain ID:", mountainId);

    // Delete mountain (cascade will handle related records)
    const { error } = await supabase
      .from("mountains")
      .delete()
      .eq("id", mountainId);

    if (error) {
      console.error("❌ [DELETE /mountains/:id] Delete error:", error);
      return NextResponse.json(
        { message: "Failed to delete mountain", error: error.message },
        { status: 500 }
      );
    }

    console.log("✅ [DELETE /mountains/:id] Mountain deleted successfully");
    return NextResponse.json({ message: "Mountain deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ [DELETE /mountains/:id] Catch block error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to delete mountain",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
