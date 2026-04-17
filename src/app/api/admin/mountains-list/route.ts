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
        mountains: [],
        message: "Supabase not configured",
      });
    }

    // Fetch all mountains (active and inactive for admin view) with their relations
    const { data: mountains, error: mountainsError } = await supabase
      .from("mountains")
      .select("*")
      .order("created_at", { ascending: false });

    if (mountainsError) {
      console.error("Error fetching mountains:", mountainsError);
      return NextResponse.json(
        { message: "Failed to fetch mountains", error: mountainsError.message },
        { status: 500 }
      );
    }

    // For each mountain, fetch its hike types and add-ons from junction tables
    const mountainsWithRelations = await Promise.all(
      (mountains || []).map(async (mountain) => {
        // Fetch hike types for this mountain
        const { data: hikeTypeLinks } = await supabase
          .from("mountain_hike_types")
          .select("price, hike_types(id, name, description, duration, fitness)")
          .eq("mountain_id", mountain.id);

        // Fetch add-ons for this mountain
        const { data: addOnLinks } = await supabase
          .from("mountain_add_ons")
          .select("price, add_ons(id, name, description)")
          .eq("mountain_id", mountain.id);

        // Transform the data
        const hike_types = (hikeTypeLinks || []).map((link: any) => ({
          id: link.hike_types?.id,
          name: link.hike_types?.name,
          description: link.hike_types?.description,
          duration: link.hike_types?.duration,
          fitness: link.hike_types?.fitness,
          price: link.price,
        }));

        const add_ons = (addOnLinks || []).map((link: any) => ({
          id: link.add_ons?.id,
          name: link.add_ons?.name,
          description: link.add_ons?.description,
          price: link.price,
        }));

        return {
          ...mountain,
          hike_types,
          add_ons,
        };
      })
    );

    return NextResponse.json({
      mountains: mountainsWithRelations || [],
      message: "Mountains fetched successfully",
    });
  } catch (error) {
    console.error("Mountains API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { message: "Supabase not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      location,
      difficulty,
      elevation_meters,
      duration_hours,
      max_participants,
      price,
      is_active,
      hikeTypes,
      addOns,
    } = body;

    // Insert new mountain
    const { data, error } = await supabase
      .from("mountains")
      .insert([
        {
          name,
          description,
          location,
          difficulty,
          elevation_meters,
          duration_hours,
          max_participants,
          price,
          is_active,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating mountain:", error);
      return NextResponse.json(
        { message: "Failed to create mountain", error: error.message },
        { status: 500 }
      );
    }

    const mountainId = data?.[0]?.id;

    // Insert hike types via junction table if provided
    if (mountainId && Array.isArray(hikeTypes) && hikeTypes.length > 0) {
      const hikeTypeRecords = hikeTypes.map((ht: any) => ({
        mountain_id: mountainId,
        hike_type_id: ht.id,
        price: Number(ht.price) || 0,
      }));

      const { error: hikeTypesError } = await supabase
        .from("mountain_hike_types")
        .insert(hikeTypeRecords);

      if (hikeTypesError) {
        console.error("Error creating mountain hike types:", hikeTypesError);
      }
    }

    // Insert add-ons via junction table if provided
    if (mountainId && Array.isArray(addOns) && addOns.length > 0) {
      const addOnRecords = addOns.map((ao: any) => ({
        mountain_id: mountainId,
        add_on_id: ao.id,
        price: Number(ao.price) || 0,
      }));

      const { error: addOnsError } = await supabase
        .from("mountain_add_ons")
        .insert(addOnRecords);

      if (addOnsError) {
        console.error("Error creating mountain add-ons:", addOnsError);
      }
    }

    return NextResponse.json({
      mountain: data?.[0],
      message: "Mountain created successfully",
    });
  } catch (error) {
    console.error("Mountains POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
