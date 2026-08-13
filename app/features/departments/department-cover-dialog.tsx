import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { FileChooser } from "~/components/ui/file-chooser";
import { CameraIcon, TrashIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal, ModalActions } from "~/components/ui/modal";
import { departmentService } from "~/services/department.service";

type DepartmentCoverDialogProps = {
  department: {
    id: number;
    abbrev: string;
    coverImageUrl: string | null;
  } | null;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
};

type PixelCrop = {
  width: number;
  height: number;
  x: number;
  y: number;
};

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ACCEPTED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function DepartmentCoverDialog({
  department,
  onClose,
  onChanged,
}: DepartmentCoverDialogProps) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  useEffect(() => {
    setCurrentUrl(department?.coverImageUrl ?? null);
    setOriginalFile(null);
    setCropSrc("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
    if (department?.coverImageUrl) {
      let active = true;
      departmentService.getCoverRaw(department.id, false).then((blob) => {
        if (active) setCurrentUrl(URL.createObjectURL(blob));
      }).catch(() => {});
      return () => { active = false; };
    }
  }, [department?.id, department?.coverImageUrl]);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const onCropComplete = useCallback((_: unknown, areaPixels: PixelCrop) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  function resetCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setOriginalFile(null);
    setCropSrc("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
  }

  function handleClose() {
    if (saving) return;
    resetCrop();
    onClose();
  }

  function handleSelect(file: File) {
    setError(null);
    if (!ACCEPTED_COVER_TYPES.has(file.type)) {
      setError("Choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setError("Cover images must be 5 MB or smaller.");
      return;
    }

    resetCrop();
    setOriginalFile(file);
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!department || !originalFile || !cropSrc || !croppedAreaPixels) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedCoverBlob(cropSrc, croppedAreaPixels);
      const croppedFile = new File([blob], "department-cover.jpg", { type: "image/jpeg" });
      const result = await departmentService.uploadCover(department.id, croppedFile, originalFile);
      setCurrentUrl(result.url);
      if (result.message) toast.success(result.message);
      await onChanged();
      resetCrop();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the cover.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!department) return;
    const message = await departmentService.removeCover(department.id);
    setCurrentUrl(null);
    if (message) toast.success(message);
    await onChanged();
    onClose();
  }

  return (
    <>
      <Modal
        open={department !== null && !cropSrc}
        onClose={handleClose}
        title="Department Cover"
        wide
      >
        <div className="flex flex-col gap-4">
          <FormError message={error} />

          <div className="relative aspect-16/5 overflow-hidden rounded-xl border border-slate-200 bg-navy-900 dark:border-white/10">
            {currentUrl ? (
              <img src={currentUrl} alt="" className="size-full object-cover object-center" />
            ) : (
              <div className="grid size-full place-items-center bg-linear-to-br from-navy-900 via-navy-800 to-gwc-blue-deep text-white/45">
                <CameraIcon size={32} />
              </div>
            )}
            <div className="absolute inset-0 bg-navy-950/20" />
          </div>

          <FileChooser
            id="department-cover-file"
            accept="image/jpeg,image/png,image/webp"
            hint="JPG, PNG, or WEBP, up to 5 MB. You can crop and reposition it before uploading."
            onChange={handleSelect}
          />

          <ModalActions className="justify-between">
            <Button type="button" variant="outline" block={false} onClick={handleClose}>
              Cancel
            </Button>
            {currentUrl && (
              <Button
                type="button"
                variant="danger"
                block={false}
                onClick={() => setRemoveOpen(true)}
              >
                <TrashIcon />
                Remove cover
              </Button>
            )}
          </ModalActions>
        </div>
      </Modal>

      <Modal
        open={department !== null && Boolean(cropSrc)}
        onClose={saving ? () => {} : resetCrop}
        title="Adjust Department Cover"
        wide
      >
        <div className="flex flex-col gap-4">
          <FormError message={error} />

          <div className="relative aspect-16/5 overflow-hidden rounded-xl bg-navy-900">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 5}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <p className="text-center font-body text-sm text-slate-500 dark:text-slate-400">
            Drag the image to reposition it. Use the slider to zoom in or out.
          </p>

          <div className="flex items-center gap-3">
            <label
              htmlFor="department-cover-zoom"
              className="shrink-0 font-body text-xs text-slate-500 dark:text-slate-400"
            >
              Zoom
            </label>
            <input
              id="department-cover-zoom"
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-navy-800 dark:accent-white"
            />
          </div>

          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={resetCrop} disabled={saving}>
              Back
            </Button>
            <Button
              type="button"
              block={false}
              disabled={!croppedAreaPixels}
              isLoading={saving}
              loadingLabel="Uploading…"
              onClick={handleSave}
            >
              Save cover
            </Button>
          </ModalActions>
        </div>
      </Modal>

      <ConfirmDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove cover"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={handleRemove}
      >
        The current cover for {department?.abbrev ?? "this department"} will be removed.
      </ConfirmDialog>
    </>
  );
}

async function getCroppedCoverBlob(imageSrc: string, pixelCrop: PixelCrop): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 500;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the cover image.");

  context.drawImage(
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
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not crop the cover image."))),
      "image/jpeg",
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = src;
  });
}
