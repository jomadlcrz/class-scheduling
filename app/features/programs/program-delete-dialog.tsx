import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { BookIcon, LayersIcon, UsersIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { programService } from "~/services/program.service";
import type { Program, ProgramDeletePreview } from "~/types/program";

type ProgramDeleteDialogProps = {
  program: Program | null;
  onClose: () => void;
  onConfirm: (program: Program) => Promise<void>;
};

const summaryRowClassName =
  "flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-white/5";

/** Confirm-preview dialog for deleting a program: fetches GET /programs/:id/delete-preview,
 * lists everything the cascade will touch, and requires typing the program's
 * abbreviation to confirm. Nothing data-driven blocks the delete anymore. */
export function ProgramDeleteDialog({ program, onClose, onConfirm }: ProgramDeleteDialogProps) {
  const [preview, setPreview] = useState<ProgramDeletePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!program) return;
    setPreview(null);
    setError(null);
    setConfirmValue("");
    setDeleting(false);
    setLoading(true);
    programService
      .getDeletePreview(program.id)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [program]);

  const confirmed =
    program !== null && confirmValue.trim().toUpperCase() === program.abbrev;

  async function handleDelete() {
    if (!program) return;
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(program);
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

    const sharedSubjects = preview.will_delete.subjects.filter((s) => s.shared);
    const { regular_students_affected, faculty_assignments, enrolled_subjects } =
      preview.will_delete;
    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Deleting{" "}
          <span className="font-medium text-navy-700 dark:text-mist-100">
            {preview.program.program_abbrev} — {preview.program.program_name}
          </span>{" "}
          cascades through everything that only exists for this program. Regular
          students' academic records are kept — they just end up pointing at an
          inactive program.
        </p>

        <ul className="flex flex-col gap-2">
          {regular_students_affected > 0 && (
            <li className={summaryRowClassName}>
              <span className="flex items-center gap-2">
                <UsersIcon />
                Regular students affected (records kept)
              </span>
              <span className="font-medium">{regular_students_affected}</span>
            </li>
          )}
          {faculty_assignments.length > 0 && (
            <li className="flex flex-col gap-1.5">
              <div className={summaryRowClassName}>
                <span className="flex items-center gap-2">
                  <BookIcon />
                  Instructor assignments removed
                </span>
                <span className="font-medium">{faculty_assignments.length}</span>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {faculty_assignments.map((a) => (
                  <li
                    key={`${a.instructor_name}-${a.subject_code}`}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    {a.instructor_name} — {a.subject_code}
                  </li>
                ))}
              </ul>
            </li>
          )}
          {enrolled_subjects > 0 && (
            <li className={summaryRowClassName}>
              <span>Irregular students' enrolled subjects</span>
              <span className="font-medium">{enrolled_subjects}</span>
            </li>
          )}
          <li className={summaryRowClassName}>
            <span>Curriculum links</span>
            <span className="font-medium">{preview.will_delete.curriculum_links}</span>
          </li>
          <li className="flex flex-col gap-1.5">
            <div className={summaryRowClassName}>
              <span>Subjects exclusive to this program</span>
              <span className="font-medium">
                {preview.will_delete.subjects.length - sharedSubjects.length}
              </span>
            </div>
            {sharedSubjects.length > 0 && (
              <div className={summaryRowClassName}>
                <span>Shared subjects (unlinked, kept active)</span>
                <span className="font-medium">{sharedSubjects.length}</span>
              </div>
            )}
          </li>
          <li className="flex flex-col gap-1.5">
            <div className={summaryRowClassName}>
              <span className="flex items-center gap-2">
                <LayersIcon />
                Sets
              </span>
              <span className="font-medium">{preview.will_delete.sets.length}</span>
            </div>
            {preview.will_delete.sets.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {preview.will_delete.sets.map((s) => (
                  <li
                    key={s.set_id}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    {s.set_name}
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li className={summaryRowClassName}>
            <span>Regular schedule sessions</span>
            <span className="font-medium">{preview.will_delete.regular_schedules}</span>
          </li>
        </ul>

        {preview.will_delete.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {preview.will_delete.subjects.map((s) => (
              <span
                key={s.subject_id}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {s.subject_code}
                {s.shared ? " (shared)" : ""}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="program-delete-confirm"
            className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
          >
            Type{" "}
            <span className="font-semibold text-navy-700 dark:text-mist-100">
              {preview.program.program_abbrev}
            </span>{" "}
            to confirm deletion
          </label>
          <input
            id="program-delete-confirm"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={preview.program.program_abbrev}
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
            Delete program
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={program !== null} onClose={onClose} title="Delete program" wide>
      {renderBody()}
    </Modal>
  );
}
