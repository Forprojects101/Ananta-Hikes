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
        contentSettings: [],
        message: "Supabase not configured",
      });
    }

    // Fetch all content settings
    const { data: contentSettings, error } = await supabase
      .from("content_settings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching content settings:", error);
      return NextResponse.json(
        { message: "Failed to fetch settings", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      contentSettings: contentSettings || [],
      message: "Settings fetched successfully",
    });
  } catch (error) {
    console.error("Settings API error:", error);
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
    const { contentSettings } = body;

    if (!Array.isArray(contentSettings)) {
      return NextResponse.json(
        { message: "Invalid content settings format" },
        { status: 400 }
      );
    }

    // Update or insert each setting
    const updates = await Promise.all(
      contentSettings.map(async (setting: any) => {
        const { data, error } = await supabase
          .from("content_settings")
          .upsert(
            {
              key: setting.key,
              name: setting.name,
              value: setting.value,
              content_type: setting.content_type || "text",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          )
          .select();

        if (error) throw error;
        return data?.[0];
      })
    );

    return NextResponse.json({
      contentSettings: updates,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json(
      { message: "Failed to save settings", error: String(error) },
      { status: 500 }
    );
  }
}
