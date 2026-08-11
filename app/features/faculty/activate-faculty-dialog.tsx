import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import type { Faculty } from "~/types/faculty";

type ActivateFacultyDialogProps = {
  member: Faculty | null;
  onClose: () => void;
  onConfirm: (member: Faculty, reason: string) => Promise<void>;
};

export function ActivateFacultyDialog({ member, onClose, onConfirm }: ActivateFacultyDialogProps) {
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
    <Modal open={member !== null} onClose={handleClose} title="Activate faculty member">
      <p className="font-body text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-navy-800 dark:text-mist-100">
          {member?.firstName} {member?.lastName}
        </span>{" "}
        will be restored to active status.
      </p>
      <div className="mt-4">
        <Input
          id="activate-faculty-reason"
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
