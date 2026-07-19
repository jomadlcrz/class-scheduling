import { ConfirmDialog } from "~/components/ui/modal";
import type { Administrator } from "~/types/administrator";

type ActivateAdministratorDialogProps = {
  admin: Administrator | null;
  onClose: () => void;
  onConfirm: (admin: Administrator) => Promise<void>;
};

export function ActivateAdministratorDialog({
  admin,
  onClose,
  onConfirm,
}: ActivateAdministratorDialogProps) {
  return (
    <ConfirmDialog
      open={admin !== null}
      onClose={onClose}
      title="Activate administrator"
      confirmLabel="Activate"
      loadingLabel="Activating…"
      onConfirm={() => onConfirm(admin!)}
    >
      <span className="font-medium text-navy-700 dark:text-mist-100">
        {admin?.firstName} {admin?.lastName}
      </span>{" "}
      will be able to log in again with their existing password.
    </ConfirmDialog>
  );
}
