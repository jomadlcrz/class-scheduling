import { ConfirmDialog } from "~/components/ui/modal";
import type { Faculty } from "~/types/faculty";

type ActivateFacultyDialogProps = {
  member: Faculty | null;
  onClose: () => void;
  onConfirm: (member: Faculty) => Promise<void>;
};

export function ActivateFacultyDialog({ member, onClose, onConfirm }: ActivateFacultyDialogProps) {
  return (
    <ConfirmDialog
      open={member !== null}
      onClose={onClose}
      title="Activate faculty member"
      confirmLabel="Activate"
      loadingLabel="Activating…"
      onConfirm={() => onConfirm(member!)}
    >
      <span className="font-medium text-navy-700 dark:text-white">
        {member?.firstName} {member?.lastName}
      </span>{" "}
      will be restored to active status.
    </ConfirmDialog>
  );
}
