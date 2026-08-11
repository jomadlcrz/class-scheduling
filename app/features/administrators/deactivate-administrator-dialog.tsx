import { useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertTriangleIcon } from "~/components/ui/icons";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { DeactivateConfirmInput, DeactivateReasonSelect } from "~/features/deactivate-reason-select";
import type { Administrator } from "~/types/administrator";

type DeactivateAdministratorDialogProps = {
  admin: Administrator | null;
  onClose: () => void;
  onConfirm: (admin: Administrator, reason: string) => Promise<void>;
};

export function DeactivateAdministratorDialog({
  admin,
  onClose,
  onConfirm,
}: DeactivateAdministratorDialogProps) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!admin) return;
    setLoading(true);
    try {
      await onConfirm(admin, reason);
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
    <Modal open={admin !== null} onClose={handleClose} title="Deactivate administrator">
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertDescription>
          <span className="font-semibold">
            {admin?.firstName} {admin?.lastName}
          </span>{" "}
          will no longer be able to log in. Their data is preserved and the account can be reactivated later.
        </AlertDescription>
      </Alert>
      <div className="mt-4">
        <DeactivateReasonSelect id="deactivate-admin" reason={reason} onReasonChange={setReason} />
      </div>
      <div className="mt-4">
        <DeactivateConfirmInput id="deactivate-admin-confirm" value={confirmText} onChange={setConfirmText} />
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
