import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { Textarea } from "~/components/ui/textarea";
import type { Administrator } from "~/types/administrator";

type ActivateAdministratorDialogProps = {
  admin: Administrator | null;
  onClose: () => void;
  onConfirm: (admin: Administrator, reason: string) => Promise<void>;
};

export function ActivateAdministratorDialog({
  admin,
  onClose,
  onConfirm,
}: ActivateAdministratorDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!admin) return;
    setLoading(true);
    try {
      await onConfirm(admin, reason);
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
    <Modal open={admin !== null} onClose={handleClose} title="Activate administrator">
      <p className="font-body text-sm text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-navy-800 dark:text-mist-100">
          {admin?.firstName} {admin?.lastName}
        </span>{" "}
        will be able to log in again with their existing password.
      </p>
      <div className="mt-4">
        <Textarea
          id="activate-admin-reason"
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this account is being reactivated"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={handleClose}>
          Cancel
        </Button>
        <Button type="button" block={false} variant="primary" onClick={handleConfirm} disabled={!reason.trim()} isLoading={loading} loadingLabel="Activating…">
          Activate
        </Button>
      </div>
    </Modal>
  );
}
