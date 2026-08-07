import { useEffect, useId, useRef, useState } from "react";
import { UploadIcon } from "~/components/ui/icons";
import { StudentAvatar } from "~/features/enrollment/student-avatar";

const ACCEPTED = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const MAX_BYTES = 5 * 1024 * 1024;

type PhotoUploadFieldProps = {
  firstName?: string;
  lastName?: string;
  studentIdLabel?: string;
  photoFile: File | null;
  onPhotoChange: (file: File | null) => void;
};

/** Optional local photo picker with live preview — upload happens after profile create. */
export function PhotoUploadField({
  firstName,
  lastName,
  studentIdLabel,
  photoFile,
  onPhotoChange,
}: PhotoUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function handleFile(file: File | undefined) {
    setError(null);
    if (!file) {
      onPhotoChange(null);
      return;
    }
    const okType =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp" ||
      /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!okType) {
      setError("Use a JPG, PNG, or WebP image.");
      onPhotoChange(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Photo must be 5 MB or smaller.");
      onPhotoChange(null);
      return;
    }
    onPhotoChange(file);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <StudentAvatar firstName={firstName} lastName={lastName} photoUrl={previewUrl} />

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-1.5 font-body text-xs font-medium text-white transition-colors hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-200"
        >
          <UploadIcon size={14} />
          {photoFile ? "Change Photo" : "Upload Photo"}
        </button>
        {photoFile ? (
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              onPhotoChange(null);
              setError(null);
            }}
            className="cursor-pointer font-body text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Remove
          </button>
        ) : null}
      </div>

      <p className="text-center font-body text-[11px] text-slate-400 dark:text-slate-500">
        Optional · JPG, PNG, or WebP · max 5 MB
      </p>
      {error ? (
        <p className="text-center font-body text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <p className="font-body text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
        {studentIdLabel || "ID optional"}
      </p>
    </div>
  );
}
