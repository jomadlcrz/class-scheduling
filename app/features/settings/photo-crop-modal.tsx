import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";

type PhotoCropModalProps = {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
};

/** Facebook-style square crop with circular preview and zoom slider. */
export function PhotoCropModal({
  open,
  onClose,
  imageSrc,
  onCropComplete,
}: PhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropChange = useCallback((loc: { x: number; y: number }) => {
    setCrop(loc);
  }, []);

  const onCropCompleteInternal = useCallback(
    (_: unknown, areaPixels: { width: number; height: number; x: number; y: number }) => {
      setCroppedAreaPixels(areaPixels);
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
      onCropComplete(file);
    } finally {
      setIsSaving(false);
    }
  }, [imageSrc, croppedAreaPixels, onCropComplete]);

  function handleClose() {
    if (isSaving) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Adjust Profile Photo">
      <div className="flex flex-col gap-4">
        <div className="relative aspect-square w-full overflow-hidden rounded-full">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="photo-zoom"
            className="font-body text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            Zoom
          </label>
          <input
            id="photo-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-navy-800 dark:accent-white"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" block={false} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            block={false}
            isLoading={isSaving}
            loadingLabel="Saving…"
            onClick={handleSave}
          >
            Save Photo
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** Rasterize the cropped area to a JPEG blob using an off-screen canvas. */
async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: { width: number; height: number; x: number; y: number },
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
