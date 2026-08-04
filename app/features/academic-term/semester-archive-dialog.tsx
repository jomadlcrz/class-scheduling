import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertTriangleIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import {
  semesterService,
  type SemesterArchivePreview,
} from "~/services/semester.service";
import type { Semester } from "~/types/semester";

type SemesterArchiveDialogProps = {
  semester: Semester | null;
  onClose: () => void;
  onConfirm: (semester: Semester) => Promise<void>;
};

/** Archive flow with the backend impact preview and exact-name confirmation. */
export function SemesterArchiveDialog({
  semester,
  onClose,
  onConfirm,
}: SemesterArchiveDialogProps) {
  const [preview, setPreview] = useState<SemesterArchivePreview | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!semester) return;
    setPreview(null);
    setConfirmValue("");
    setError(null);
    setArchiving(false);
    setLoading(true);
    semesterService
      .getArchivePreview(semester.id)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [semester]);

  function handleClose() {
    if (!archiving) onClose();
  }

  async function handleArchive() {
    if (!semester) return;
    setError(null);
    setArchiving(true);
    try {
      await onConfirm(semester);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setArchiving(false);
    }
  }

  const exactName = preview?.semester.semester ?? "";
  const isConfirmed = confirmValue === exactName;

  return (
    <Modal open={semester !== null} onClose={handleClose} title="Archive Semester" wide>
      {loading ? (
        <div role="status" aria-label="Loading archive preview" className="grid place-items-center py-12">
          <Spinner />
        </div>
      ) : error && !preview ? (
        <div className="flex flex-col gap-4">
          <FormError message={error} />
          <div className="flex justify-end">
            <Button type="button" variant="outline" block={false} onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      ) : preview && semester ? (
        <div className="flex flex-col gap-5">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-gold-300">
              <AlertTriangleIcon />
            </span>
            <div>
              <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Archive {semester.displayName}? It will be removed from active selectors.
              </p>
              <p className="mt-1 font-body text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                The semester can be restored later from Archive.
              </p>
            </div>
          </div>

          {!preview.archivable ? (
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>This semester is still in use</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {preview.blockers.items.map((item) => (
                    <li key={item.key}>
                      {item.count} {item.label.toLowerCase()}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="semester-archive-confirm"
                className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
              >
                Type <span className="font-semibold">{exactName}</span> to confirm archival
              </label>
              <input
                id="semester-archive-confirm"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={confirmValue}
                onChange={(event) => setConfirmValue(event.target.value)}
                placeholder={exactName}
                className={inputClassName}
              />
            </div>
          )}

          <FormError message={error} />
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button type="button" variant="outline" block={false} onClick={handleClose}>
              {preview.archivable ? "Cancel" : "Close"}
            </Button>
            {preview.archivable && (
              <Button
                type="button"
                variant="danger"
                block={false}
                disabled={!isConfirmed}
                isLoading={archiving}
                loadingLabel="Archiving…"
                onClick={handleArchive}
              >
                Archive Semester
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
