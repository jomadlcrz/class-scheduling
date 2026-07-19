import { ConfirmDialog } from "~/components/ui/modal";
import type { User } from "~/types/user";

type DeactivateUserDialogProps = {
  user: User | null;
  onClose: () => void;
  onConfirm: (user: User) => Promise<void>;
};

export function DeactivateUserDialog({ user, onClose, onConfirm }: DeactivateUserDialogProps) {
  return (
    <ConfirmDialog
      open={user !== null}
      onClose={onClose}
      title="Deactivate user"
      confirmLabel="Deactivate"
      loadingLabel="Deactivating…"
      confirmVariant="danger"
      onConfirm={() => onConfirm(user!)}
    >
      <span className="font-medium text-navy-700 dark:text-mist-100">{user?.name}</span> will no
      longer be able to log in. Their data is kept and the account can be reactivated anytime.
    </ConfirmDialog>
  );
}
