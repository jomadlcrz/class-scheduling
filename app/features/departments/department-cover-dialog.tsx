import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { CropDialog } from "~/components/ui/crop-dialog";
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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  useEffect(() => {
    setCurrentUrl(department?.coverImageUrl ?? null);
    setOriginalFile(null);
    setCropSrc("");
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

  function resetCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setOriginalFile(null);
    setCropSrc("");
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

  async function handleCropSave(croppedFile: File) {
    if (!department || !originalFile) return;
    setSaving(true);
    setError(null);
    try {
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
        title={department?.coverImageUrl ? "Edit Department Cover" : "Add Department Cover"}
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

      <CropDialog
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        aspect={16 / 5}
        outputWidth={1600}
        outputHeight={500}
        wide
        title="Adjust Department Cover"
        saveLabel="Save cover"
        onClose={handleClose}
        onBack={resetCrop}
        onSave={handleCropSave}
      />

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
