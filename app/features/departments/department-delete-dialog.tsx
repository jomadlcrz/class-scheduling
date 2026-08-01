import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertTriangleIcon, FolderOpenIcon, UsersIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { departmentService } from "~/services/department.service";
import type { Department, DepartmentDeletePreview } from "~/types/department";

type DepartmentDeleteDialogProps = {
  department: Department | null;
  onClose: () => void;
  onConfirm: (department: Department) => Promise<void>;
};

const summaryRowClassName =
  "flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-white/5";

/** Confirm-preview dialog for deleting a department: fetches GET /departments/:id/delete-preview.
 * Programs cascade fully; staff assignment still blocks outright (accounts are never
 * touched). Requires typing the department's own abbreviation to confirm. */
export function DepartmentDeleteDialog({ department, onClose, onConfirm }: DepartmentDeleteDialogProps) {
  const [preview, setPreview] = useState<DepartmentDeletePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!department) return;
    setPreview(null);
    setError(null);
    setConfirmValue("");
    setDeleting(false);
    setLoading(true);
    departmentService
      .getDeletePreview(department.id)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [department]);

  const confirmed =
    preview !== null && confirmValue.trim().toUpperCase() === preview.department.department_abbrev;

  async function handleDelete() {
    if (!department) return;
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(department);
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

    if (!preview.deletable) {
      return (
        <div className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>Staff are still assigned</AlertTitle>
            <AlertDescription>
              <span className="flex items-center gap-2">
                <UsersIcon />
                {preview.blockers.staff}{" "}
                {preview.blockers.staff === 1 ? "staff member" : "staff members"} still
                assigned to this department.
              </span>
            </AlertDescription>
          </Alert>
          <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            User accounts are never touched by this feature — instructors, deans,
            registrars, and super-admins assigned here must be moved or reassigned
            first, then you can retry.
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="outline" block={false} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      );
    }

    const programs = preview.will_delete.programs;
    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Deleting{" "}
          <span className="font-medium text-navy-700 dark:text-mist-100">
            {preview.department.department_abbrev} — {preview.department.department_name}
          </span>{" "}
          cascades through every program below, exactly like deleting each one
          itself: curriculum, sets, schedules, instructor assignments, and
          irregular enrollments.
        </p>

        <ul className="flex flex-col gap-2">
          <li className="flex flex-col gap-1.5">
            <div className={summaryRowClassName}>
              <span className="flex items-center gap-2">
                <FolderOpenIcon />
                Programs that cascade
              </span>
              <span className="font-medium">{programs.length}</span>
            </div>
            {programs.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {programs.map((p) => (
                  <li
                    key={p.program_id}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    {p.program_abbrev}
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="department-delete-confirm"
            className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
          >
            Type{" "}
            <span className="font-semibold text-navy-700 dark:text-mist-100">
              {preview.department.department_abbrev}
            </span>{" "}
            to confirm deletion
          </label>
          <input
            id="department-delete-confirm"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={preview.department.department_abbrev}
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
            Delete department
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={department !== null} onClose={onClose} title="Delete department" wide>
      {renderBody()}
    </Modal>
  );
}
