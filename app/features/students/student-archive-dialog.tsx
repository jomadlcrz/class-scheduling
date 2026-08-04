import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { studentService, type StudentArchivePreview } from "~/services/student.service";
import type { StudentAccountRow } from "~/types/student";

type StudentArchiveDialogProps = {
  student: StudentAccountRow | null;
  onClose: () => void;
  onConfirm: (student: StudentAccountRow) => Promise<void>;
};

function displayName(student: StudentAccountRow): string {
  if (student.studentName) return student.studentName;
  const parts = [student.firstName, student.midName].filter(Boolean).join(" ");
  return parts ? `${parts} ${student.lastName}` : student.lastName;
}

/** Confirm-preview dialog for archiving a student profile (registrar soft-delete). */
export function StudentArchiveDialog({ student, onClose, onConfirm }: StudentArchiveDialogProps) {
  const [preview, setPreview] = useState<StudentArchivePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!student) return;
    setPreview(null);
    setError(null);
    setConfirmValue("");
    setArchiving(false);
    setLoading(true);
    studentService
      .getArchivePreview(student.studentProfileId)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : ""))
      .finally(() => setLoading(false));
  }, [student]);

  const fullName = preview
    ? `${preview.student.first_name} ${preview.student.last_name}`
    : "";
  const confirmed = preview !== null && confirmValue.trim() === fullName;

  async function handleArchive() {
    if (!student || !preview) return;
    setError(null);
    setArchiving(true);
    try {
      const fullName = `${preview.student.first_name} ${preview.student.last_name}`;
      await studentService.archiveProfile(student.studentProfileId, confirmValue.trim() || fullName);
      toast.success("Student archived successfully.");
      await onConfirm(student);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setArchiving(false);
    }
  }

  return (
    <Modal open={student !== null} onClose={onClose} title="Archive student profile" wide>
      {loading ? (
        <div role="status" aria-label="Loading archive preview" className="grid place-items-center py-10">
          <Spinner />
        </div>
      ) : error && !preview ? (
        <div className="flex flex-col gap-4">
          <FormError message={error} />
          <div className="flex justify-end">
            <Button type="button" variant="outline" block={false} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : preview ? (
        <div className="flex flex-col gap-4">
          <p className="font-body text-sm text-slate-600 dark:text-slate-300">
            Archiving removes{" "}
            <span className="font-medium text-navy-700 dark:text-mist-100">{displayName(student!)}</span> from
            active lists. Academic history is preserved and can be restored from Archive at any time.
          </p>
          <ul className="flex flex-col gap-2 font-body text-sm text-slate-600 dark:text-slate-300">
            <li>{preview.willArchive.academic_terms} academic term(s)</li>
            <li>{preview.willArchive.enrolled_subjects} enrolled subject row(s)</li>
            {preview.willArchive.has_login_account ? (
              <li>The student&apos;s login account will also be deactivated.</li>
            ) : null}
          </ul>
          <FormError message={error} />
          <label className="flex flex-col gap-1.5 font-body text-sm">
            <span className="text-slate-600 dark:text-slate-300">
              Type <span className="font-medium text-navy-700 dark:text-mist-100">{fullName}</span> to confirm
            </span>
            <input
              type="text"
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              className={inputClassName}
              autoComplete="off"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" block={false} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              block={false}
              disabled={!confirmed}
              isLoading={archiving}
              loadingLabel="Archiving…"
              onClick={handleArchive}
            >
              Archive profile
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
