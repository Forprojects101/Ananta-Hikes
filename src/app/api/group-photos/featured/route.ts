import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Fetch the featured group photo with its testimonial
    const { data: photo, error: photoError } = await supabase
      .from("group_photos")
      .select("id, image_url, alt_text, title, location, photo_date, group_type")
      .eq("is_featured", true)
      .eq("is_active", true)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        { error: "No featured group photo found" },
        { status: 404 }
      );
    }

    // Check if image URL exists
    if (!photo.image_url) {
      return NextResponse.json(
        { error: "Featured photo is missing an image URL" },
        { status: 400 }
      );
    }

    // Fetch the testimonial for this photo
    const { data: testimonial } = await supabase
      .from("testimonials")
      .select("hiker_name, testimonial_text")
      .eq("group_photo_id", photo.id)
      .eq("is_active", true)
      .eq("is_approved", true)
      .single();

    // Format the response to match the GroupHikePhoto type
    const formattedPhoto = {
      id: photo.id,
      image: photo.image_url,
      alt: photo.alt_text || "Group hike photo",
      title: photo.title,
      location: photo.location || "Mountain",
      date: photo.photo_date
        ? new Date(photo.photo_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Date TBD",
      groupType: photo.group_type || "Group hike",
      testimonial: testimonial
        ? {
            name: testimonial.hiker_name,
            text: testimonial.testimonial_text,
          }
        : undefined,
    };

    return NextResponse.json(formattedPhoto);
  } catch (error) {
    console.error("Error fetching featured group photo:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured group photo" },
      { status: 500 }
    );
  }
}
