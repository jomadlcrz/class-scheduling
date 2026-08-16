import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { FileChooser } from "~/components/ui/file-chooser";
import { ImageViewer } from "~/components/ui/image-viewer";
import { Modal, ModalActions } from "~/components/ui/modal";
import { ProfileAvatar } from "~/components/ui/profile-avatar";

type ProfilePictureModalProps = {
  open: boolean;
  onClose: () => void;
  photoUrl: string | null;
  gender?: string | null;
  onChanged: () => void;
  uploadPhoto: (file: File) => Promise<{ url: string; message: string }>;
  removePhoto: () => Promise<string>;
};

export function ProfilePictureModal({
  open,
  onClose,
  photoUrl,
  gender,
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
  const [fullViewOpen, setFullViewOpen] = useState(false);

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

  function handleFileSelect(file: File) {
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!croppedAreaPixels || !cropSrc) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
      const result = await uploadPhoto(file);
      reset();
      onChanged();
      if (result.message) toast.success(result.message);
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
      const message = await removePhoto();
      reset();
      onChanged();
      if (message) toast.success(message);
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
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            {photoUrl ? (
              <button
                type="button"
                onClick={() => setFullViewOpen(true)}
                className="cursor-pointer rounded-full transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
              >
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="size-24 rounded-full object-cover"
                />
              </button>
            ) : <ProfileAvatar gender={gender} className="size-24" />}
          </div>

          {photoUrl && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Click the image to see full view.
            </p>
          )}

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              Upload new custom profile picture:
            </p>
            <FileChooser
              id="profile-picture-file"
              accept="image/jpeg,image/png,image/webp"
              hint="It is recommended that you use an image that is at least 400×400 pixels."
              onChange={handleFileSelect}
            />
          </div>

          <ModalActions>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={handleClose}
              disabled={removing}
            >
              Cancel
            </Button>
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
          </ModalActions>
        </div>
      </Modal>

      {/* ── Adjust modal: crop + zoom + save ── */}
      <Modal open={open && isCropping} onClose={saving ? () => {} : handleClose} title="Adjust Profile Photo">
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
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
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Drag the image to position it, then click <strong>Save Photo</strong>.
          </p>

          <div className="flex items-center gap-3">
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

          <ModalActions>
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
          </ModalActions>
        </div>
      </Modal>

      {/* ── Full view modal ── */}
      {photoUrl && (
        <ImageViewer
          open={fullViewOpen}
          onClose={() => setFullViewOpen(false)}
          src={photoUrl}
          alt="Profile picture full view"
        />
      )}
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
