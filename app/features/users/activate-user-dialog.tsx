import { ConfirmDialog } from "~/components/ui/modal";
import type { User } from "~/types/user";

type ActivateUserDialogProps = {
  user: User | null;
  onClose: () => void;
  onConfirm: (user: User) => Promise<void>;
};

export function ActivateUserDialog({ user, onClose, onConfirm }: ActivateUserDialogProps) {
  return (
    <ConfirmDialog
      open={user !== null}
      onClose={onClose}
      title="Activate user"
      confirmLabel="Activate"
      loadingLabel="Activating…"
      onConfirm={() => onConfirm(user!)}
    >
      <span className="font-medium text-navy-700 dark:text-mist-100">{user?.name}</span> will be
      able to log in again with their existing password.
    </ConfirmDialog>
  );
}
