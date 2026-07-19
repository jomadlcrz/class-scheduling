import { ConfirmDialog } from "~/components/ui/modal";
import type { Administrator } from "~/types/administrator";

type DeactivateAdministratorDialogProps = {
  admin: Administrator | null;
  onClose: () => void;
  onConfirm: (admin: Administrator) => Promise<void>;
};

export function DeactivateAdministratorDialog({
  admin,
  onClose,
  onConfirm,
}: DeactivateAdministratorDialogProps) {
  return (
    <ConfirmDialog
      open={admin !== null}
      onClose={onClose}
      title="Deactivate administrator"
      confirmLabel="Deactivate"
      loadingLabel="Deactivating…"
      confirmVariant="danger"
      onConfirm={() => onConfirm(admin!)}
    >
      <span className="font-medium text-navy-700 dark:text-mist-100">
        {admin?.firstName} {admin?.lastName}
      </span>{" "}
      will no longer be able to log in. Their data is kept and the account can be reactivated anytime.
    </ConfirmDialog>
  );
}
