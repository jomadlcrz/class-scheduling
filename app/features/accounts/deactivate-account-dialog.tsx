import { ConfirmDialog } from "~/components/ui/modal";
import type { Account } from "~/types/account";

type DeactivateAccountDialogProps = {
  account: Account | null;
  onClose: () => void;
  onConfirm: (account: Account) => Promise<void>;
};

export function DeactivateAccountDialog({
  account,
  onClose,
  onConfirm,
}: DeactivateAccountDialogProps) {
  return (
    <ConfirmDialog
      open={account !== null}
      onClose={onClose}
      title="Deactivate account"
      confirmLabel="Deactivate"
      loadingLabel="Deactivating…"
      confirmVariant="danger"
      onConfirm={() => onConfirm(account!)}
    >
      <span className="font-medium text-navy-700 dark:text-mist-100">{account?.email}</span>{" "}
      will no longer be able to log in. Their data is kept and the account can be reactivated anytime.
    </ConfirmDialog>
  );
}
