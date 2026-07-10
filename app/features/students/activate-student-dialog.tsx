import { ConfirmDialog } from "~/components/ui/modal";
import type { Student } from "~/types/student";

type ActivateStudentDialogProps = {
  student: Student | null;
  onClose: () => void;
  onConfirm: (student: Student) => Promise<void>;
};

export function ActivateStudentDialog({ student, onClose, onConfirm }: ActivateStudentDialogProps) {
  return (
    <ConfirmDialog
      open={student !== null}
      onClose={onClose}
      title="Activate student"
      confirmLabel="Activate"
      loadingLabel="Activating…"
      onConfirm={() => onConfirm(student!)}
    >
      <span className="font-medium text-navy-700 dark:text-white">
        {student?.firstName} {student?.lastName} ({student?.studentNumber})
      </span>{" "}
      will be restored to active status.
    </ConfirmDialog>
  );
}
