import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
}

function isUuid(value: string | undefined) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toJsonArray(value: unknown) {
  return Array.isArray(value) ? value : null;
}

async function ensureAdmin(request: NextRequest, supabase: any) {
  const token = request.cookies.get("auth-token")?.value || request.cookies.get("verified-token")?.value;
  
  console.log("🔐 [ensureAdmin] Checking auth token:", token ? "Present" : "Missing");
  
  if (!token) {
    console.warn("⚠️ [ensureAdmin] No token found in cookies");
    return false;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, role_id, roles(name)")
    .eq("id", token)
    .maybeSingle();

  console.log("🔐 [ensureAdmin] User query result:", { user, error });

  if (error || !user) {
    console.warn("⚠️ [ensureAdmin] User not found or query error:", error);
    return false;
  }

  const roleData = (user as any)?.roles as { name?: string } | undefined;
  const roleName = roleData?.name;
  
  console.log("🔐 [ensureAdmin] User role:", roleName);
  
  const isAdmin = roleName === "Admin" || roleName === "Super Admin";
  console.log("🔐 [ensureAdmin] Is admin:", isAdmin);
  
  return isAdmin;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🏔️ [POST /mountains] Request received");
    
    const supabase = getSupabaseServerClient();
    if (!(await ensureAdmin(request, supabase))) {
      console.warn("⚠️ [POST /mountains] Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const token = request.cookies.get("auth-token")?.value || request.cookies.get("verified-token")?.value;
    const body = await request.json();
    
    console.log("📥 [POST /mountains] Request body keys:", Object.keys(body));
    console.log("📥 [POST /mountains] Request body:", JSON.stringify(body, null, 2));

    if (body?.hikeTypes !== undefined && !Array.isArray(body.hikeTypes)) {
      console.warn("⚠️ [POST /mountains] hikeTypes is not an array:", typeof body.hikeTypes);
      return NextResponse.json({ message: "hikeTypes must be an array" }, { status: 400 });
    }

    if (body?.addOns !== undefined && !Array.isArray(body.addOns)) {
      console.warn("⚠️ [POST /mountains] addOns is not an array:", typeof body.addOns);
      return NextResponse.json({ message: "addOns must be an array" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      name: String(body?.name || "").trim(),
      location: body?.location ? String(body.location).trim() : null,
      difficulty: body?.difficulty || null,
      elevation_meters: body?.elevationMeters ? Number(body.elevationMeters) : null,
      max_participants: body?.maxParticipants ? Number(body.maxParticipants) : 30,
      description: body?.description ? String(body.description).trim() : null,
      inclusions: body?.inclusions ? [String(body.inclusions).trim()] : null,
      image_url: body?.imageUrl ? String(body.imageUrl).trim() : null,
      is_active: body?.isActive !== false,
    };

    console.log("📋 [POST /mountains] Payload to insert:", JSON.stringify(payload, null, 2));

    const hikeTypes = toJsonArray(body?.hikeTypes);
    const addOns = toJsonArray(body?.addOns);
    console.log("📊 [POST /mountains] Hike types to link:", hikeTypes?.length || 0);
    console.log("📊 [POST /mountains] Add-ons to link:", addOns?.length || 0);

    if (isUuid(token)) {
      payload.created_by = token;
      payload.updated_by = token;
      console.log("👤 [POST /mountains] User token:", token);
    }

    if (!payload.name) {
      console.warn("⚠️ [POST /mountains] Mountain name is required");
      return NextResponse.json({ message: "Mountain name is required" }, { status: 400 });
    }

    console.log("💾 [POST /mountains] Inserting mountain into database...");
    const { data, error } = await supabase
      .from("mountains")
      .insert(payload)
      .select("id, name, location, difficulty, elevation_meters, max_participants, is_active, inclusions")
      .single();

    if (error) {
      console.error("❌ [POST /mountains] Supabase error:", error);
      console.error("❌ [POST /mountains] Error details:", {
        code: error.code,
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
      });
      return NextResponse.json(
        { 
          message: error.message,
          code: error.code,
          details: (error as any).details,
        },
        { status: 500 }
      );
    }
    
    if (!data?.id) {
      console.error("❌ [POST /mountains] No mountain ID returned from insert");
      return NextResponse.json(
        { message: "Mountain created but ID not returned" },
        { status: 500 }
      );
    }

    const mountainId = data.id;
    console.log("✅ [POST /mountains] Mountain created with ID:", mountainId);

    // Insert hike type relationships
    if (hikeTypes && hikeTypes.length > 0) {
      console.log("🔗 [POST /mountains] Inserting hike type relationships...");
      const hikeTypeRecords = hikeTypes.map((ht: any) => ({
        mountain_id: mountainId,
        hike_type_id: ht.id,
        price: ht.price || null,
        multiplier: ht.multiplier || 1.0,
      }));
      
      console.log("📝 [POST /mountains] Hike type records to insert:", hikeTypeRecords);
      const { error: htError } = await supabase
        .from("mountain_hike_types")
        .insert(hikeTypeRecords);

      if (htError) {
        console.error("❌ [POST /mountains] Error inserting hike types:", htError);
        console.error("❌ [POST /mountains] Hike type error details:", {
          code: htError.code,
          message: htError.message,
          details: (htError as any).details,
        });
        // Don't fail here - mountain is created, just log the error
      } else {
        console.log("✅ [POST /mountains] Hike type relationships inserted successfully");
      }
    }

    // Insert add-on relationships
    if (addOns && addOns.length > 0) {
      console.log("🔗 [POST /mountains] Inserting add-on relationships...");
      const addOnRecords = addOns.map((ao: any) => ({
        mountain_id: mountainId,
        add_on_id: ao.id,
        price: ao.price || null,
      }));
      
      console.log("📝 [POST /mountains] Add-on records to insert:", addOnRecords);
      const { error: aoError } = await supabase
        .from("mountain_add_ons")
        .insert(addOnRecords);

      if (aoError) {
        console.error("❌ [POST /mountains] Error inserting add-ons:", aoError);
        console.error("❌ [POST /mountains] Add-on error details:", {
          code: aoError.code,
          message: aoError.message,
          details: (aoError as any).details,
        });
        // Don't fail here - mountain is created, just log the error
      } else {
        console.log("✅ [POST /mountains] Add-on relationships inserted successfully");
      }
    }

    console.log("✅ [POST /mountains] Mountain and relationships created successfully");
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("❌ [POST /mountains] Catch block error:", error);
    console.error("❌ [POST /mountains] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "No stack",
    });
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to create mountain",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
