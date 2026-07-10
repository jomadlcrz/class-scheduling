import { ConfirmDialog } from "~/components/ui/modal";
import type { Student } from "~/types/student";

type DeactivateStudentDialogProps = {
  student: Student | null;
  onClose: () => void;
  onConfirm: (student: Student) => Promise<void>;
};

export function DeactivateStudentDialog({ student, onClose, onConfirm }: DeactivateStudentDialogProps) {
  return (
    <ConfirmDialog
      open={student !== null}
      onClose={onClose}
      title="Deactivate student"
      confirmLabel="Deactivate"
      loadingLabel="Deactivating…"
      confirmVariant="danger"
      onConfirm={() => onConfirm(student!)}
    >
      <span className="font-medium text-navy-700 dark:text-white">
        {student?.firstName} {student?.lastName} ({student?.studentNumber})
      </span>{" "}
      will be marked as inactive. Their data is kept and can be reactivated anytime.
    </ConfirmDialog>
  );
}
