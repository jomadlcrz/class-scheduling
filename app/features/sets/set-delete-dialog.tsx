import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { CalendarIcon, UsersIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { setService } from "~/services/set.service";
import type { ClassSet, SetDeletePreview } from "~/types/set";

type SetDeleteDialogProps = {
  set: ClassSet | null;
  onClose: () => void;
  onConfirm: (set: ClassSet) => Promise<void>;
};

const summaryRowClassName =
  "flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-white/5";

/** Confirm-preview dialog for deleting a set: fetches GET /sets/:id/delete-preview,
 * lists everything the cascade will touch, and requires typing the set's own
 * code to confirm. Nothing data-driven blocks the delete anymore. */
export function SetDeleteDialog({ set, onClose, onConfirm }: SetDeleteDialogProps) {
  const [preview, setPreview] = useState<SetDeletePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!set) return;
    setPreview(null);
    setError(null);
    setConfirmValue("");
    setDeleting(false);
    setLoading(true);
    setService
      .getDeletePreview(set.id)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [set]);

  const confirmed =
    preview !== null && confirmValue.trim().toUpperCase() === preview.set.set_code;

  async function handleDelete() {
    if (!set) return;
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(set);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setDeleting(false);
    }
  }

  function renderBody() {
    if (loading) {
      return (
        <div
          role="status"
          aria-label="Loading delete preview"
          className="grid place-items-center py-10 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col gap-4">
          <FormError message={error} />
          <div className="flex justify-end">
            <Button type="button" variant="outline" block={false} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      );
    }

    if (!preview) return null;

    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Deleting{" "}
          <span className="font-medium text-navy-700 dark:text-mist-100">
            {preview.set.set_name}
          </span>{" "}
          clears every regular schedule this set has ever had, in any school
          year or semester. Students' academic records are kept — they just end
          up pointing at an inactive set.
        </p>

        <ul className="flex flex-col gap-2">
          <li className={summaryRowClassName}>
            <span className="flex items-center gap-2">
              <CalendarIcon />
              Regular schedule sessions cleared
            </span>
            <span className="font-medium">{preview.will_delete.regular_schedules}</span>
          </li>
          <li className={summaryRowClassName}>
            <span className="flex items-center gap-2">
              <UsersIcon />
              Students affected (records kept)
            </span>
            <span className="font-medium">{preview.will_delete.students_affected}</span>
          </li>
        </ul>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="set-delete-confirm"
            className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
          >
            Type{" "}
            <span className="font-semibold text-navy-700 dark:text-mist-100">
              {preview.set.set_code}
            </span>{" "}
            to confirm deletion
          </label>
          <input
            id="set-delete-confirm"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={preview.set.set_code}
            className={`${inputClassName} font-mono uppercase tracking-wide`}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            block={false}
            disabled={!confirmed}
            isLoading={deleting}
            loadingLabel="Deleting…"
            onClick={handleDelete}
          >
            Delete set
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={set !== null} onClose={onClose} title="Delete set" wide>
      {renderBody()}
    </Modal>
  );
}
