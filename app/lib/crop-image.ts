export type PixelCrop = { width: number; height: number; x: number; y: number };

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = src;
  });
}

export async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  width?: number,
  height?: number,
  errorMessage = "Could not crop the image.",
  circle = false,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = width ?? pixelCrop.width;
  canvas.height = height ?? pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(errorMessage);

  if (circle) {
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    ctx.clip();
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(errorMessage))),
      circle ? "image/png" : "image/jpeg",
      circle ? undefined : 0.92,
    );
  });
}
