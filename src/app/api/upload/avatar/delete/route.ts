import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { message: "Public ID is required" },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    return NextResponse.json(
      { message: "Avatar deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete avatar" },
      { status: 500 }
    );
  }
}
