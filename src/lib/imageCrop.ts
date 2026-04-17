/**
 * Crop image based on crop area coordinates from react-easy-crop
 * croppedArea should already be in pixel coordinates of the original image
 */
export async function getCroppedImage(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
  rotation: number = 0
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Use the cropped area pixel values directly
      const { x, y, width, height } = croppedAreaPixels;

      // Set canvas to the crop size
      canvas.width = width;
      canvas.height = height;

      // Apply rotation if needed
      if (rotation) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // Draw the cropped portion of the image
      ctx.drawImage(
        image,
        x,           // source x
        y,           // source y
        width,       // source width
        height,      // source height
        0,           // dest x
        0,           // dest y
        width,       // dest width
        height       // dest height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas is empty"));
          }
        },
        "image/jpeg",
        0.95
      );
    };
    image.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
}
