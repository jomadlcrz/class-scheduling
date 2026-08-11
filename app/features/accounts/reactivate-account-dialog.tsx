import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import type { Account } from "~/types/account";

type ReactivateAccountDialogProps = {
  account: Account | null;
  onClose: () => void;
  onConfirm: (account: Account, reason: string) => Promise<void>;
};

export function ReactivateAccountDialog({
  account,
  onClose,
  onConfirm,
}: ReactivateAccountDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!account) return;
    setLoading(true);
    try {
      await onConfirm(account, reason);
      setReason("");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setReason("");
    onClose();
  }

  return (
    <Modal open={account !== null} onClose={handleClose} title="Reactivate account">
      <p className="font-body text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-navy-800 dark:text-mist-100">{account?.email}</span>{" "}
        will be able to log in again with their existing password.
      </p>
      <div className="mt-4">
        <Input
          id="reactivate-account-reason"
          label="Reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a reason for reactivation"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={handleClose}>
          Cancel
        </Button>
        <Button type="button" block={false} variant="primary" onClick={handleConfirm} disabled={!reason.trim()} isLoading={loading} loadingLabel="Reactivating…">
          Reactivate
        </Button>
      </div>
    </Modal>
  );
}
