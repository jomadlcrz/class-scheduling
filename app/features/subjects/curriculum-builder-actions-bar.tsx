import { useRef, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { HelpCircleIcon, UploadIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import {
  parseCurriculumWorkbook,
  type CurriculumImportRow,
} from "~/lib/curriculum-excel";
import {
  CurriculumBuilderModeToggle,
  type CurriculumBuilderMode,
} from "~/features/subjects/curriculum-builder-mode-toggle";

type CurriculumBuilderActionsBarProps = {
  mode: CurriculumBuilderMode;
  onModeChange: (mode: CurriculumBuilderMode) => void;
  pendingCount?: number;
  isSaving?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  /** Hide the Cancel/Save cluster when a wizard's own footer already owns save/cancel actions. */
  showSaveActions?: boolean;
  /** Append subjects parsed from an imported Excel/CSV file to the draft. */
  onImport?: (rows: CurriculumImportRow[]) => void;
};

export function CurriculumBuilderActionsBar({
  mode,
  onModeChange,
  pendingCount = 0,
  isSaving = false,
  onSave,
  onCancel,
  showSaveActions = true,
  onImport,
}: CurriculumBuilderActionsBarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [formatHelpOpen, setFormatHelpOpen] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;
    setImporting(true);
    setImportError(null);
    try {
      const rows = await parseCurriculumWorkbook(file);
      if (rows.length === 0) {
        setImportError("No valid rows found in the file.");
        return;
      }
      onImport(rows);
      toast.success(`Imported ${rows.length} subject${rows.length === 1 ? "" : "s"}.`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Couldn't read the file.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-3 border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-surface-overlay/60">
      <div className="flex flex-wrap items-center gap-1.5">
        <CurriculumBuilderModeToggle value={mode} onChange={onModeChange} />
        <span
          aria-hidden="true"
          className="mx-1 hidden h-6 w-px bg-slate-300 sm:block dark:bg-white/15"
        />
        <Button
          type="button"
          variant="outline"
          block={false}
          disabled={!onImport || importing}
          isLoading={importing}
          loadingLabel="Importing…"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon />
          Import Excel
        </Button>
        <button
          type="button"
          onClick={() => setFormatHelpOpen(true)}
          className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-mist-100"
          aria-label="Excel import format help"
        >
          <span className="scale-90">
            <HelpCircleIcon />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          aria-label="Import curriculum from Excel"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>
      {showSaveActions && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" block={false} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            block={false}
            disabled={pendingCount === 0}
            isLoading={isSaving}
            loadingLabel="Saving…"
            onClick={onSave}
          >
            Save Curriculum{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Button>
        </div>
      )}
      {importError && (
        <div className="w-full">
          <FormError message={importError} />
        </div>
      )}
      </Card>

      <Modal
        open={formatHelpOpen}
        onClose={() => setFormatHelpOpen(false)}
        title="Excel import format"
      >
        <div className="space-y-4 font-body text-sm leading-relaxed">
          <p className="text-slate-500 dark:text-slate-400">
            Upload an .xlsx, .xls, or .csv file with one subject per row. The header row must use
            these columns:
          </p>
          <ul className="list-inside list-disc space-y-1.5 text-slate-500 dark:text-slate-400">
            <li>
              <span className="font-semibold text-navy-800 dark:text-mist-100">Year Level</span> —
              the year slot (1, 2, 3, …)
            </li>
            <li>
              <span className="font-semibold text-navy-800 dark:text-mist-100">Semester</span> — the
              semester slot (1 or 2)
            </li>
            <li>
              <span className="font-semibold text-navy-800 dark:text-mist-100">Subject Code</span> —
              e.g. CS 101
            </li>
            <li>
              <span className="font-semibold text-navy-800 dark:text-mist-100">
                Descriptive Title
              </span>{" "}
              — e.g. Introduction to Computing
            </li>
            <li>
              <span className="font-semibold text-navy-800 dark:text-mist-100">Units</span> — a
              number, at least 1
            </li>
            <li>
              <span className="font-semibold text-navy-800 dark:text-mist-100">Subject Type</span>{" "}
              — pick from the subject type list used in this builder
            </li>
            <li>
              <span className="font-semibold text-navy-800 dark:text-mist-100">Prerequisites</span>{" "}
              — optional; separate multiple codes with a comma
            </li>
          </ul>
          <p className="text-slate-500 dark:text-slate-400">
            Use the Download icon on the Program Curricula page to export a curriculum and use it as
            a template.
          </p>
          <div className="flex justify-end pt-1">
            <Button type="button" block={false} onClick={() => setFormatHelpOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
