import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/ui/modal";
import { Textarea } from "~/components/ui/textarea";
import type { ScheduleRelease } from "~/types/schedule-release";

type ScheduleRejectDialogProps = {
  open: boolean;
  release: ScheduleRelease | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
};

/** Backend rejects with 400 below this length — gate the button instead of guessing at its message. */
const MIN_REASON_LENGTH = 10;

/** Confirms rejecting a pending schedule release with a required reason. */
export function ScheduleRejectDialog({ open, release, onClose, onConfirm }: ScheduleRejectDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reject schedule.");
    } finally {
      setSubmitting(false);
    }
  }

  const reasonLength = reason.trim().length;
  const reasonHint =
    reasonLength < MIN_REASON_LENGTH
      ? `At least ${MIN_REASON_LENGTH} characters (${reasonLength}/${MIN_REASON_LENGTH}).`
      : `${reasonLength} characters.`;

  return (
    <Modal open={open} onClose={handleClose} title="Reject schedule">
      <div className="flex flex-col gap-4">
        <FormError message={error} />
        <p className="font-body text-sm text-slate-600 dark:text-slate-300">
          Reject {release?.programAbbrev} {release?.setCode}? It returns to the registrar as a draft with
          your reason attached so they can revise and resubmit it.
        </p>
        <Textarea
          id="schedule-reject-reason"
          label="Reason for rejection"
          hint={reasonHint}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain what needs to change before this can be approved"
          required
        />
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
          <Button type="button" variant="outline" block={false} disabled={submitting} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            block={false}
            disabled={submitting || reason.trim().length < MIN_REASON_LENGTH}
            isLoading={submitting}
            loadingLabel="Rejecting…"
            onClick={handleConfirm}
          >
            Reject schedule
          </Button>
        </div>
      </div>
    </Modal>
  );
}
