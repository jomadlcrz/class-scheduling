import { useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertTriangleIcon } from "~/components/ui/icons";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { DeactivateConfirmInput, DeactivateReasonSelect } from "~/features/deactivate-reason-select";
import type { Faculty } from "~/types/faculty";

type DeactivateFacultyDialogProps = {
  member: Faculty | null;
  onClose: () => void;
  onConfirm: (member: Faculty, reason: string) => Promise<void>;
};

export function DeactivateFacultyDialog({ member, onClose, onConfirm }: DeactivateFacultyDialogProps) {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!member) return;
    setLoading(true);
    try {
      await onConfirm(member, reason);
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
    <Modal open={member !== null} onClose={handleClose} title="Deactivate faculty member">
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertDescription>
          <span className="font-semibold">
            {member?.firstName} {member?.lastName}
          </span>{" "}
          will no longer be able to log in. Their data is preserved and the account can be reactivated later.
        </AlertDescription>
      </Alert>
      <div className="mt-4">
        <DeactivateReasonSelect id="deactivate-faculty" reason={reason} onReasonChange={setReason} />
      </div>
      <div className="mt-4">
        <DeactivateConfirmInput id="deactivate-faculty-confirm" value={confirmText} onChange={setConfirmText} />
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
