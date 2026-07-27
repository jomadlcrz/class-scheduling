import { useRef, useState } from "react";
import { UploadIcon } from "~/components/ui/icons";

type FileChooserProps = {
  id: string;
  accept?: string;
  hint?: string;
  onChange: (file: File) => void;
};

export function FileChooser({ id, accept, hint, onChange }: FileChooserProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
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

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left font-body text-sm text-slate-600 transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/25 dark:hover:bg-white/8"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500">
          <UploadIcon />
        </span>
        <span className="min-w-0 flex-1">
          {fileName ? (
            <span className="block truncate font-medium text-navy-800 dark:text-mist-100">
              {fileName}
            </span>
          ) : (
            <span className="block text-slate-400 dark:text-slate-500">
              Choose a file…
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-md border border-slate-200 px-2 py-0.5 font-body text-xs font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
          Browse
        </span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
      </button>
      {hint && (
        <p className="font-body text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}
