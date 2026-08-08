import type { ReactNode } from "react";
import { ConfirmDialog } from "~/components/ui/modal";
import { BellIcon, BriefcaseIcon, GraduationCapIcon } from "~/components/ui/icons";
import type { ScheduleRelease } from "~/types/schedule-release";

type ScheduleApproveDialogProps = {
  open: boolean;
  release: ScheduleRelease | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

function Consequence({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

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
      <p>
        Approving{" "}
        <span className="font-semibold text-navy-700 dark:text-mist-100">
          {release?.programAbbrev} {release?.setCode}
        </span>{" "}
        ({release?.sessionCount ?? 0} session{release?.sessionCount === 1 ? "" : "s"}) publishes it. This will:
      </p>
      <ul className="mt-3 flex flex-col gap-2.5">
        <Consequence icon={<GraduationCapIcon />}>
          Make the timetable visible to the regular students in this section
        </Consequence>
        <Consequence icon={<BriefcaseIcon size={14} />}>
          Show it to every instructor with a class in it
        </Consequence>
        <Consequence icon={<BellIcon />}>Send each of them a schedule notification</Consequence>
      </ul>
    </ConfirmDialog>
  );
}
