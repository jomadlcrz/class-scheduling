import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Button } from "~/components/ui/button";
import { Modal, ModalActions } from "~/components/ui/modal";
import { getCroppedBlob, type PixelCrop } from "~/lib/crop-image";

type CropDialogProps = {
  open: boolean;
  imageSrc: string;
  aspect: number;
  outputWidth?: number;
  outputHeight?: number;
  cropShape?: "round" | "rect";
  showGrid?: boolean;
  wide?: boolean;
  title: string;
  saveLabel?: string;
  hint?: string;
  previewClassName?: string;
  onClose: () => void;
  onBack: () => void;
  onSave: (file: File) => Promise<void>;
};

export function CropDialog({
  open,
  imageSrc,
  aspect,
  outputWidth,
  outputHeight,
  cropShape = "rect",
  showGrid = true,
  wide,
  title,
  saveLabel = "Save",
  hint = "Drag the image to reposition it. Use the slider to zoom in or out.",
  previewClassName,
  onClose,
  onBack,
  onSave,
}: CropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<PixelCrop | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedPixels(null);
      setError(null);
    }
  }, [open]);

  const onCropComplete = useCallback((_: unknown, area: PixelCrop) => {
    setCroppedPixels(area);
  }, []);

  function handleBack() {
    if (saving) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedPixels(null);
    setError(null);
    onBack();
  }

  async function handleSave() {
    if (!croppedPixels) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedPixels, outputWidth, outputHeight);
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      await onSave(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to crop the image.");
    } finally {
      setSaving(false);
    }
  }

  const cropContainerClass = previewClassName
    ?? (cropShape === "round"
      ? "relative aspect-square w-80 overflow-hidden rounded-full"
      : "relative overflow-hidden rounded-xl bg-navy-900");

  const shouldCenter = Boolean(previewClassName || cropShape === "round");

  return (
    <Modal open={open} onClose={saving ? () => {} : handleBack} title={title} wide={wide}>
      <div className="flex flex-col gap-4">
        {error && <p className="font-body text-sm text-red-600 dark:text-red-400">{error}</p>}

        {shouldCenter ? (
          <div className="flex justify-center">
            <div className={cropContainerClass}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape={cropShape}
                showGrid={showGrid}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          </div>
        ) : (
          <div className={cropContainerClass} style={!previewClassName ? { aspectRatio: aspect } : undefined}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={showGrid}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        )}

        <p className="text-center font-body text-sm text-slate-500 dark:text-slate-400">{hint}</p>

        <div className="flex items-center gap-3">
          <label
            htmlFor="crop-dialog-zoom"
            className="shrink-0 font-body text-xs text-slate-500 dark:text-slate-400"
          >
            Zoom
          </label>
          <input
            id="crop-dialog-zoom"
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
          <Button type="button" variant="outline" block={false} onClick={handleBack} disabled={saving}>
            Back
          </Button>
          <Button
            type="button"
            block={false}
            disabled={!croppedPixels}
            isLoading={saving}
            loadingLabel="Saving…"
            onClick={handleSave}
          >
            {saveLabel}
          </Button>
        </ModalActions>
      </div>
    </Modal>
  );
}
