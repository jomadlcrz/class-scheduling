import { ConfirmDialog } from "~/components/ui/modal";
import type { Faculty } from "~/types/faculty";

type DeactivateFacultyDialogProps = {
  member: Faculty | null;
  onClose: () => void;
  onConfirm: (member: Faculty) => Promise<void>;
};

export function DeactivateFacultyDialog({ member, onClose, onConfirm }: DeactivateFacultyDialogProps) {
  return (
    <ConfirmDialog
      open={member !== null}
      onClose={onClose}
      title="Deactivate faculty member"
      confirmLabel="Deactivate"
      loadingLabel="Deactivating…"
      confirmVariant="danger"
      onConfirm={() => onConfirm(member!)}
    >
      <span className="font-medium text-navy-700 dark:text-mist-100">
        {member?.firstName} {member?.lastName}
      </span>{" "}
      will be marked as inactive. Their data is kept and can be reactivated anytime.
    </ConfirmDialog>
  );
}
