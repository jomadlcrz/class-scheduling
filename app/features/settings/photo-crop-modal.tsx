import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";

type ProfilePictureModalProps = {
  open: boolean;
  onClose: () => void;
  photoUrl: string | null;
  initials: string;
  onChanged: () => void;
  uploadPhoto: (file: File) => Promise<string>;
  removePhoto: () => Promise<void>;
};

export function ProfilePictureModal({
  open,
  onClose,
  photoUrl,
  initials,
  onChanged,
  uploadPhoto,
  removePhoto,
}: ProfilePictureModalProps) {
  const [cropSrc, setCropSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCropping = cropSrc !== "";

  const onCropChange = useCallback((loc: { x: number; y: number }) => {
    setCrop(loc);
  }, []);

  const onCropComplete = useCallback(
    (_: unknown, areaPixels: { width: number; height: number; x: number; y: number }) => {
      setCroppedAreaPixels(areaPixels);
    },
    [],
  );

  function reset() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  function handleClose() {
    if (saving || removing) return;
    reset();
    onClose();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleSave() {
    if (!croppedAreaPixels || !cropSrc) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
      await uploadPhoto(file);
      reset();
      onChanged();
      toast.success("Profile photo updated.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setRemoving(true);
    try {
      await removePhoto();
      reset();
      onChanged();
      toast.success("Profile photo removed.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      {/* ── Main modal: current photo + upload/delete ── */}
      <Modal open={open && !isCropping} onClose={handleClose} title="Profile Picture">
        <div className="flex flex-col items-center gap-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="size-24 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-24 place-items-center rounded-full bg-navy-800 font-body text-3xl font-medium text-white dark:bg-white dark:text-navy-900">
              {initials}
            </span>
          )}

          <div className="w-full">
            <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              Upload new custom profile picture:
            </p>
            <label
              htmlFor="profile-picture-file"
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/15 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5"
            >
              <span className="truncate">No file chosen</span>
              <input
                ref={fileInputRef}
                id="profile-picture-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              It is recommended that you use an image that is at least 400x400 pixels.
            </p>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            {photoUrl && (
              <Button
                type="button"
                variant="danger"
                block={false}
                isLoading={removing}
                loadingLabel="Deleting…"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={handleClose}
              disabled={removing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Adjust modal: crop + zoom + save ── */}
      <Modal open={open && isCropping} onClose={saving ? () => {} : handleClose} title="Adjust Profile Photo">
        <div className="flex flex-col items-center gap-4">
          <div className="relative aspect-square w-48 overflow-hidden rounded-full">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={onCropChange}
              onCropComplete={onCropComplete}
            />
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Drag the image to position it, then click <strong>Save Photo</strong>.
          </p>

          <div className="flex w-full items-center gap-3">
            <label
              htmlFor="profile-picture-zoom"
              className="shrink-0 text-xs text-slate-400 dark:text-slate-500"
            >
              Zoom
            </label>
            <input
              id="profile-picture-zoom"
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-navy-800 dark:accent-white"
            />
          </div>

          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => { reset(); }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              block={false}
              isLoading={saving}
              loadingLabel="Saving…"
              onClick={handleSave}
            >
              Save Photo
            </Button>
          </div>
        </div>
      </Modal>
    </>
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
