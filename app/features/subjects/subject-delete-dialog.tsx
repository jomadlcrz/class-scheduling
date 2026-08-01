import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { BlocksIcon, BookIcon, CalendarIcon, LayersIcon, UsersIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { subjectService } from "~/services/subject.service";
import type { Subject, SubjectDeletePreview } from "~/types/subject";

type SubjectDeleteDialogProps = {
  subject: Subject | null;
  onClose: () => void;
  onConfirm: (subject: Subject) => Promise<void>;
};

const summaryRowClassName =
  "flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-white/5";

/** Confirm-preview dialog for deleting a subject: fetches GET /subjects/:id/delete-preview,
 * lists everything the cascade will touch across every program that uses it, and requires
 * typing the subject's own code to confirm. Nothing data-driven blocks the delete. */
export function SubjectDeleteDialog({ subject, onClose, onConfirm }: SubjectDeleteDialogProps) {
  const [preview, setPreview] = useState<SubjectDeletePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!subject) return;
    setPreview(null);
    setError(null);
    setConfirmValue("");
    setDeleting(false);
    setLoading(true);
    subjectService
      .getDeletePreview(subject.id)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [subject]);

  const confirmed =
    preview !== null && confirmValue.trim().toUpperCase() === preview.subject.subject_code;

  async function handleDelete() {
    if (!subject) return;
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(subject);
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

    const { programs, faculty_assignments } = preview.will_delete;
    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Deleting{" "}
          <span className="font-medium text-navy-700 dark:text-mist-100">
            {preview.subject.subject_code} — {preview.subject.descriptive_title}
          </span>{" "}
          reaches into every program whose curriculum it sits on. Only this
          subject's own schedule sessions are cleared — the rest of each set's
          schedule is left intact.
        </p>

        <ul className="flex flex-col gap-2">
          <li className="flex flex-col gap-1.5">
            <div className={summaryRowClassName}>
              <span className="flex items-center gap-2">
                <LayersIcon />
                Programs affected
              </span>
              <span className="font-medium">{programs.length}</span>
            </div>
            {programs.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {programs.map((abbrev) => (
                  <li
                    key={abbrev}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    {abbrev}
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li className={summaryRowClassName}>
            <span>Curriculum links</span>
            <span className="font-medium">{preview.will_delete.curriculum_links}</span>
          </li>
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
                    key={`${a.instructor_name}-${a.program_abbrev}`}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    {a.instructor_name} — {a.program_abbrev}
                  </li>
                ))}
              </ul>
            </li>
          )}
          <li className={summaryRowClassName}>
            <span className="flex items-center gap-2">
              <CalendarIcon />
              Regular schedule sessions cleared
            </span>
            <span className="font-medium">{preview.will_delete.regular_schedules}</span>
          </li>
          {preview.will_delete.enrolled_subjects > 0 && (
            <li className={summaryRowClassName}>
              <span className="flex items-center gap-2">
                <UsersIcon />
                Irregular students' enrolled subjects
              </span>
              <span className="font-medium">{preview.will_delete.enrolled_subjects}</span>
            </li>
          )}
          {preview.will_delete.prerequisite_links > 0 && (
            <li className={summaryRowClassName}>
              <span className="flex items-center gap-2">
                <BlocksIcon />
                Prerequisite links (both directions)
              </span>
              <span className="font-medium">{preview.will_delete.prerequisite_links}</span>
            </li>
          )}
        </ul>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="subject-delete-confirm"
            className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
          >
            Type{" "}
            <span className="font-semibold text-navy-700 dark:text-mist-100">
              {preview.subject.subject_code}
            </span>{" "}
            to confirm deletion
          </label>
          <input
            id="subject-delete-confirm"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={preview.subject.subject_code}
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
            Delete subject
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={subject !== null} onClose={onClose} title="Delete subject" wide>
      {renderBody()}
    </Modal>
  );
}
