import { useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertTriangleIcon } from "~/components/ui/icons";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { DeactivateConfirmInput, DeactivateReasonSelect } from "~/features/deactivate-reason-select";
import type { Account } from "~/types/account";

type DeactivateAccountDialogProps = {
  account: Account | null;
  onClose: () => void;
  onConfirm: (account: Account, reason: string) => Promise<void>;
};

export function DeactivateAccountDialog({
  account,
  onClose,
  onConfirm,
}: DeactivateAccountDialogProps) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!account) return;
    setLoading(true);
    try {
      await onConfirm(account, reason);
      setReason("");
      setConfirmText("");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setReason("");
    setConfirmText("");
    onClose();
  }

  const confirmValid = confirmText === "DEACTIVATE" && reason.trim().length > 0;

  return (
    <Modal open={account !== null} onClose={handleClose} title="Deactivate account">
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertDescription>
          <span className="font-semibold">{account?.email}</span>{" "}
          will no longer be able to log in. Their data is preserved and the account can be reactivated later.
        </AlertDescription>
      </Alert>
      <div className="mt-4">
        <DeactivateReasonSelect id="deactivate-account" reason={reason} onReasonChange={setReason} />
      </div>
      <div className="mt-4">
        <DeactivateConfirmInput id="deactivate-account-confirm" value={confirmText} onChange={setConfirmText} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={handleClose}>
          Cancel
        </Button>
        <Button type="button" block={false} variant="danger" onClick={handleConfirm} disabled={!confirmValid} isLoading={loading} loadingLabel="Deactivating…">
          Deactivate
        </Button>
      </div>
    </Modal>
  );
}
