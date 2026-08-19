import { useEffect, useRef, useState } from "react";
import { CheckIcon, CloseIcon, UploadIcon } from "~/components/ui/icons";

type FileChooserProps = {
  id: string;
  accept?: string;
  hint?: string;
  fileName?: string | null;
  previewUrl?: string | null;
  onChange: (file: File) => void;
  onClear?: () => void;
};

export function FileChooser({
  id,
  accept,
  hint,
  fileName: externalFileName,
  previewUrl: externalPreviewUrl,
  onChange,
  onClear,
}: FileChooserProps) {
  const [internalFileName, setInternalFileName] = useState<string | null>(null);
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = externalFileName !== undefined;
  const fileName = isControlled ? externalFileName : internalFileName;
  const preview = externalPreviewUrl !== undefined ? externalPreviewUrl : internalPreviewUrl;

  useEffect(() => {
    return () => {
      if (internalPreviewUrl) URL.revokeObjectURL(internalPreviewUrl);
    };
  }, [internalPreviewUrl]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isControlled) {
      setInternalFileName(file.name);
      if (file.type.startsWith("image/")) {
        if (internalPreviewUrl) URL.revokeObjectURL(internalPreviewUrl);
        setInternalPreviewUrl(URL.createObjectURL(file));
      } else {
        setInternalPreviewUrl(null);
      }
    }
    onChange(file);
    e.target.value = "";
  }

  function handleClick() {
    inputRef.current?.click();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    if (internalPreviewUrl) URL.revokeObjectURL(internalPreviewUrl);
    setInternalPreviewUrl(null);
    setInternalFileName(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left font-body text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
          fileName
            ? "border-emerald-300 bg-emerald-50/50 text-navy-800 hover:border-emerald-400 hover:bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-mist-100 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/30"
            : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/25 dark:hover:bg-white/8"
        }`}
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            className="size-8 shrink-0 rounded-md border border-emerald-300/60 bg-white object-contain p-0.5 dark:border-emerald-500/30 dark:bg-white/10"
          />
        ) : (
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-md transition-colors ${
              fileName
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                : "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500"
            }`}
          >
            {fileName ? <CheckIcon size={16} /> : <UploadIcon />}
          </span>
        )}

        <span className="min-w-0 flex-1">
          {fileName ? (
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Uploaded
              </span>
              <span className="block truncate font-medium text-navy-800 dark:text-mist-100">
                {fileName}
              </span>
            </div>
          ) : (
            <span className="block text-slate-400 dark:text-slate-500">
              Choose a file…
            </span>
          )}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          {fileName && onClear && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Remove selected file"
              title="Remove selected file"
              className="grid size-6 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300"
            >
              <CloseIcon size={13} />
            </button>
          )}
          <span
            className={`rounded-md border px-2 py-0.5 font-body text-xs font-medium transition-colors ${
              fileName
                ? "border-emerald-200 bg-white/80 text-emerald-700 group-hover:bg-white dark:border-emerald-500/30 dark:bg-white/5 dark:text-emerald-300 dark:group-hover:bg-white/10"
                : "border-slate-200 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-600 dark:border-white/10 dark:text-slate-400 dark:group-hover:border-white/20 dark:group-hover:text-slate-300"
            }`}
          >
            {fileName ? "Change" : "Browse"}
          </span>
        </div>

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {hint && (
        <p className="font-body text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}
