import { useEffect, useState } from "react";
import { ConfirmDialog } from "~/components/ui/modal";
import { Textarea } from "~/components/ui/textarea";
import type { ScheduleRelease } from "~/types/schedule-release";

type ScheduleSubmitDialogProps = {
  open: boolean;
  release: ScheduleRelease | null;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
};

/** Confirms submitting a draft/rejected schedule release for Dean review. */
export function ScheduleSubmitDialog({ open, release, onClose, onConfirm }: ScheduleSubmitDialogProps) {
  const isRejected = release?.releaseStatus === "rejected";
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Submit for Dean review"
      confirmLabel="Submit for Dean review"
      loadingLabel="Submitting…"
      onConfirm={() => {
        if (isRejected && note.trim().length < 10) {
          throw new Error("Add a note of at least 10 characters explaining what you revised.");
        }
        return onConfirm(note.trim());
      }}
    >
      Submit {release?.programAbbrev} {release?.setCode} ({release?.sessionCount ?? 0} session
      {release?.sessionCount === 1 ? "" : "s"}) to the department dean for review? You can withdraw it
      while it is pending. When the term calendar is governing the workflow, distribute the complete term
      from Scheduling Calendar instead.
      {isRejected && release?.rejectionReason && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-gold-400/20 dark:bg-gold-400/10 dark:text-gold-300">
          Previous rejection reason: {release.rejectionReason}
        </p>
      )}
      {isRejected && (
        <div className="mt-4">
          <Textarea
            id="submit-note"
            label="Note for the dean"
            required
            hint="Required when resubmitting a rejected schedule. At least 10 characters."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}
    </ConfirmDialog>
  );
}
