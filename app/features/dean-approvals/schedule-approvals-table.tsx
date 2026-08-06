import { CheckIcon, CloseIcon, EyeIcon } from "~/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { scheduleReleaseStatusLabel, scheduleReleaseStatusTone, StatusBadge } from "~/features/academic-terms/status-badges";
import { TableActionButton } from "~/features/academic-terms/table-action-button";
import type { ScheduleRelease } from "~/types/schedule-release";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
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
        <TableHeader className="hidden md:table-cell">Submitted At</TableHeader>
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
            <TableCell className="hidden md:table-cell">{formatDateTime(row.submittedAt)}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <TableActionButton onClick={() => onPreview(row)}>
                  <EyeIcon />
                  Preview
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
        <TableHeader className="hidden md:table-cell">Reviewed At</TableHeader>
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
            <TableCell className="hidden md:table-cell">{formatDateTime(row.reviewedAt)}</TableCell>
            <TableCell className="hidden lg:table-cell">{row.rejectionReason ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
