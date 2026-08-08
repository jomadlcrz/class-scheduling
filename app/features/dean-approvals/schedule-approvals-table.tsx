import { CheckIcon, ClockIcon, CloseIcon, EyeIcon } from "~/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { scheduleReleaseStatusLabel, scheduleReleaseStatusTone, StatusBadge } from "~/features/academic-terms/status-badges";
import { TableActionButton } from "~/features/academic-terms/table-action-button";
import { daysSince, formatDateTime, formatRelativeTime } from "~/lib/time";
import type { ScheduleRelease } from "~/types/schedule-release";

/** Relative "submitted N ago", tinted amber once a release has been waiting three days or more. */
function WaitingCell({ iso }: { iso: string | null }) {
  const relative = formatRelativeTime(iso);
  const days = daysSince(iso);
  const stale = days != null && days >= 3;

  if (!relative) return <span className="text-slate-400 dark:text-slate-500">—</span>;

  return (
    <span
      title={formatDateTime(iso)}
      className={
        stale
          ? "inline-flex items-center gap-1 font-medium text-amber-700 dark:text-gold-300"
          : "text-slate-600 dark:text-slate-300"
      }
    >
      {stale && <ClockIcon size={14} />}
      {relative}
    </span>
  );
}

type PendingTableProps = {
  releases: ScheduleRelease[];
  onPreview: (release: ScheduleRelease) => void;
  onApprove: (release: ScheduleRelease) => void;
  onReject: (release: ScheduleRelease) => void;
};

export function SchedulePendingApprovalsTable({ releases, onPreview, onApprove, onReject }: PendingTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Set</TableHeader>
        <TableHeader className="text-center">Sessions</TableHeader>
        <TableHeader>Submitted By</TableHeader>
        <TableHeader className="hidden md:table-cell">Waiting</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {releases.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">
                {row.programAbbrev} {row.setCode}
              </span>
              {row.yearLevel != null && (
                <span className="ml-1.5 text-slate-500 dark:text-slate-400">Yr {row.yearLevel}</span>
              )}
            </TableCell>
            <TableCell className="text-center">{row.sessionCount}</TableCell>
            <TableCell>{row.submittedBy?.name ?? "—"}</TableCell>
            <TableCell className="hidden md:table-cell">
              <WaitingCell iso={row.submittedAt} />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <TableActionButton onClick={() => onPreview(row)}>
                  <EyeIcon />
                  Review
                </TableActionButton>
                <TableActionButton tone="amber" onClick={() => onApprove(row)}>
                  <CheckIcon size={14} />
                  Approve
                </TableActionButton>
                <TableActionButton tone="slate" onClick={() => onReject(row)}>
                  <CloseIcon size={14} />
                  Reject
                </TableActionButton>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type ReviewedTableProps = {
  releases: ScheduleRelease[];
};

export function ScheduleRecentlyReviewedTable({ releases }: ReviewedTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Set</TableHeader>
        <TableHeader>Decision</TableHeader>
        <TableHeader className="hidden md:table-cell">Reviewed</TableHeader>
        <TableHeader className="hidden lg:table-cell">Note</TableHeader>
      </TableHead>
      <TableBody>
        {releases.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">
                {row.programAbbrev} {row.setCode}
              </span>
            </TableCell>
            <TableCell>
              <StatusBadge tone={scheduleReleaseStatusTone(row.releaseStatus)}>
                {scheduleReleaseStatusLabel(row.releaseStatus)}
              </StatusBadge>
            </TableCell>
            <TableCell className="hidden md:table-cell text-slate-600 dark:text-slate-300">
              <span title={formatDateTime(row.reviewedAt)}>{formatRelativeTime(row.reviewedAt) || "—"}</span>
            </TableCell>
            <TableCell className="hidden lg:table-cell">{row.rejectionReason ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
