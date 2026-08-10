import { ConfirmDialog } from "~/components/ui/modal";
import type { Account } from "~/types/account";

type ReactivateAccountDialogProps = {
  account: Account | null;
  onClose: () => void;
  onConfirm: (account: Account) => Promise<void>;
};

export function ReactivateAccountDialog({
  account,
  onClose,
  onConfirm,
}: ReactivateAccountDialogProps) {
  return (
    <ConfirmDialog
      open={account !== null}
      onClose={onClose}
      title="Reactivate account"
      confirmLabel="Reactivate"
      loadingLabel="Reactivating…"
      onConfirm={() => onConfirm(account!)}
    >
      <span className="font-medium text-navy-700 dark:text-mist-100">{account?.email}</span>{" "}
      will be able to log in again with their existing password.
    </ConfirmDialog>
  );
}
