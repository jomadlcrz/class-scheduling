import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { BookOpenIcon, GraduationHatIcon, UploadIcon, UserOffIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { studentService } from "~/services/student.service";
import type { StudentAccountRow, StudentDeletePreview } from "~/types/student";

type StudentDeleteDialogProps = {
  student: StudentAccountRow | null;
  onClose: () => void;
  onConfirm: (student: StudentAccountRow, confirmText: string) => Promise<void>;
};

const summaryRowClassName =
  "flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-white/5";

/** Confirm-preview dialog for deleting a student profile: fetches GET /students/:id/delete-preview.
 * Deleting soft-deletes the profile and deactivates the login account (never deletes the
 * User row). Academic history and the S3 photo are untouched for the 30-day recycle-bin
 * window — restore in time and nothing changes. Requires typing the student's full name. */
export function StudentDeleteDialog({ student, onClose, onConfirm }: StudentDeleteDialogProps) {
  const [preview, setPreview] = useState<StudentDeletePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!student) return;
    setPreview(null);
    setError(null);
    setConfirmValue("");
    setDeleting(false);
    setLoading(true);
    studentService
      .getDeletePreview(student.studentProfileId)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [student]);

  const fullName = preview ? `${preview.student.first_name} ${preview.student.last_name}` : "";
  const confirmed = preview !== null && confirmValue.trim() === fullName;

  async function handleDelete() {
    if (!student) return;
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(student, fullName);
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

    const { academic_terms, enrolled_subjects, has_login_account, has_profile_photo } =
      preview.will_delete;
    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Deleting{" "}
          <span className="font-medium text-navy-700 dark:text-mist-100">{fullName}</span>'s
          profile soft-deletes it and{" "}
          {has_login_account
            ? "deactivates their login account"
            : "leaves them without a login account"}{" "}
          — accounts are never deleted. Their academic history and profile photo
          survive untouched for the full 30-day recycle-bin window: restore the
          profile within that window and nothing about their record ever changes.
        </p>

        <ul className="flex flex-col gap-2">
          <li className={summaryRowClassName}>
            <span className="flex items-center gap-2">
              <GraduationHatIcon />
              Academic terms (kept untouched)
            </span>
            <span className="font-medium">{academic_terms}</span>
          </li>
          <li className={summaryRowClassName}>
            <span className="flex items-center gap-2">
              <BookOpenIcon />
              Enrolled subjects (kept untouched)
            </span>
            <span className="font-medium">{enrolled_subjects}</span>
          </li>
          {has_login_account && (
            <li className={summaryRowClassName}>
              <span className="flex items-center gap-2">
                <UserOffIcon />
                Login account deactivated
              </span>
              <span className="font-medium">Yes</span>
            </li>
          )}
          {has_profile_photo && (
            <li className={summaryRowClassName}>
              <span className="flex items-center gap-2">
                <UploadIcon />
                Profile photo (deleted only at purge)
              </span>
              <span className="font-medium">Yes</span>
            </li>
          )}
        </ul>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="student-delete-confirm"
            className="font-body text-sm font-medium text-navy-700 dark:text-mist-100"
          >
            Type{" "}
            <span className="font-semibold text-navy-700 dark:text-mist-100">{fullName}</span>{" "}
            to confirm deletion
          </label>
          <input
            id="student-delete-confirm"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={fullName}
            className={inputClassName}
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
            Delete student
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal open={student !== null} onClose={onClose} title="Delete student" wide>
      {renderBody()}
    </Modal>
  );
}
