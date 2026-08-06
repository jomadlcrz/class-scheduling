import { ConfirmDialog } from "~/components/ui/modal";
import type { ScheduleRelease } from "~/types/schedule-release";

type ScheduleSubmitDialogProps = {
  open: boolean;
  release: ScheduleRelease | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/** Confirms submitting a draft/rejected schedule release for dean approval. */
export function ScheduleSubmitDialog({ open, release, onClose, onConfirm }: ScheduleSubmitDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Submit for approval"
      confirmLabel="Submit for approval"
      loadingLabel="Submitting…"
      onConfirm={onConfirm}
    >
      Submit {release?.programAbbrev} {release?.setCode} ({release?.sessionCount ?? 0} session
      {release?.sessionCount === 1 ? "" : "s"}) to the department dean for approval? You can withdraw it
      while it's still pending.
      {release?.releaseStatus === "rejected" && release.rejectionReason && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-gold-400/20 dark:bg-gold-400/10 dark:text-gold-300">
          Previous rejection reason: {release.rejectionReason}
        </p>
      )}
    </ConfirmDialog>
  );
}
