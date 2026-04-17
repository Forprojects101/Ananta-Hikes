/**
 * Utility function to upload avatar to Cloudinary
 */
export async function uploadAvatarToCloudinary(
  file: File,
  userId: string
): Promise<{ url: string; publicId: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    const response = await fetch("/api/upload/avatar", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to upload avatar");
    }

    const data = await response.json();
    return {
      url: data.url,
      publicId: data.publicId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    throw new Error(message);
  }
}

/**
 * Utility function to delete avatar from Cloudinary
 */
export async function deleteAvatarFromCloudinary(publicId: string): Promise<void> {
  try {
    const response = await fetch("/api/upload/avatar/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to delete avatar");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    throw new Error(message);
  }
}

/**
 * Get Cloudinary image URL with transformations
 */
export function getCloudinaryImageUrl(
  publicId: string,
  width: number = 200,
  height: number = 200
): string {
  if (!publicId) return "";
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,g_face,q_auto/${publicId}`;
}
