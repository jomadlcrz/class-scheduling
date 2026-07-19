import { ConfirmDialog } from "~/components/ui/modal";
import type { Administrator } from "~/types/administrator";

type ResetPasswordDialogProps = {
  admin: Administrator | null;
  onClose: () => void;
  onConfirm: (admin: Administrator) => Promise<void>;
};

export function ResetPasswordDialog({ admin, onClose, onConfirm }: ResetPasswordDialogProps) {
  return (
    <ConfirmDialog
      open={admin !== null}
      onClose={onClose}
      title="Reset password"
      confirmLabel="Reset Password"
      loadingLabel="Resetting…"
      onConfirm={() => onConfirm(admin!)}
    >
      The password for{" "}
      <span className="font-medium text-navy-700 dark:text-mist-100">
        {admin?.firstName} {admin?.lastName}
      </span>{" "}
      will be reset to a new temporary password. They must choose a new password at their next login.
    </ConfirmDialog>
  );
}
