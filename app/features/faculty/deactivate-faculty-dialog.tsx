import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { Textarea } from "~/components/ui/textarea";
import type { Faculty } from "~/types/faculty";

type DeactivateFacultyDialogProps = {
  member: Faculty | null;
  onClose: () => void;
  onConfirm: (member: Faculty, reason: string) => Promise<void>;
};

export function DeactivateFacultyDialog({ member, onClose, onConfirm }: DeactivateFacultyDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!member) return;
    setLoading(true);
    try {
      await onConfirm(member, reason);
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
    <Modal open={member !== null} onClose={handleClose} title="Deactivate faculty member">
      <p className="font-body text-sm text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-navy-800 dark:text-mist-100">
          {member?.firstName} {member?.lastName}
        </span>{" "}
        will be marked as inactive. Their data is kept and can be reactivated anytime.
      </p>
      <div className="mt-4">
        <Textarea
          id="deactivate-faculty-reason"
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this account is being deactivated"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" block={false} onClick={handleClose}>
          Cancel
        </Button>
        <Button type="button" block={false} variant="primary" onClick={handleConfirm} disabled={!reason.trim()} isLoading={loading} loadingLabel="Deactivating…">
          Deactivate
        </Button>
      </div>
    </Modal>
  );
}
