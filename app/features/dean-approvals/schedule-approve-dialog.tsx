import { ConfirmDialog } from "~/components/ui/modal";
import type { ScheduleRelease } from "~/types/schedule-release";

type ScheduleApproveDialogProps = {
  open: boolean;
  release: ScheduleRelease | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/** Confirms approving a pending schedule release — publishes it to students, instructors, and the department. */
export function ScheduleApproveDialog({ open, release, onClose, onConfirm }: ScheduleApproveDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Approve and publish?"
      confirmLabel="Approve & publish"
      loadingLabel="Approving…"
      onConfirm={onConfirm}
    >
      Approving {release?.programAbbrev} {release?.setCode} ({release?.sessionCount ?? 0} session
      {release?.sessionCount === 1 ? "" : "s"}) makes it visible to the regular students in this section and
      the instructors with classes in it — they'll each get a schedule notification.
    </ConfirmDialog>
  );
}
