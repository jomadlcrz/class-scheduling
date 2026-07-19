import { ConfirmDialog } from "~/components/ui/modal";
import type { User } from "~/types/user";

type ResetPasswordDialogProps = {
  user: User | null;
  onClose: () => void;
  onConfirm: (user: User) => Promise<void>;
};

export function ResetPasswordDialog({ user, onClose, onConfirm }: ResetPasswordDialogProps) {
  return (
    <ConfirmDialog
      open={user !== null}
      onClose={onClose}
      title="Reset password"
      confirmLabel="Reset Password"
      loadingLabel="Resetting…"
      onConfirm={() => onConfirm(user!)}
    >
      The password for{" "}
      <span className="font-medium text-navy-700 dark:text-mist-100">{user?.name}</span> will be
      reset to the temporary default. They must choose a new password at their next login.
    </ConfirmDialog>
  );
}
