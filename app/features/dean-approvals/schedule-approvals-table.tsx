import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { CheckIcon, ClockIcon, CloseIcon, EyeIcon } from "~/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { scheduleReleaseStatusLabel, scheduleReleaseStatusTone, StatusBadge } from "~/features/academic-terms/status-badges";
import { TableActionButton } from "~/features/academic-terms/table-action-button";
import { departmentLogoUrl, onDepartmentLogoError } from "~/lib/department-logo";
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
  onSendToInstructors?: (release: ScheduleRelease) => void;
  onReject?: (release: ScheduleRelease) => void;
  onFinalApprove?: (release: ScheduleRelease) => void;
  onReturnForRevision?: (release: ScheduleRelease) => void;
};

export function SchedulePendingApprovalsTable({
  releases,
  onPreview,
  onSendToInstructors,
  onReject,
  onFinalApprove,
  onReturnForRevision,
}: PendingTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Set</TableHeader>
        <TableHeader className="text-center">Sessions</TableHeader>
        <TableHeader>Submitted by</TableHeader>
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
                {row.releaseStatus === "pending_dean_review" && onSendToInstructors && (
                  <TableActionButton tone="amber" onClick={() => onSendToInstructors(row)}>
                    <CheckIcon size={14} />
                    Send to instructors
                  </TableActionButton>
                )}
                {row.releaseStatus === "pending_dean_review" && onReject && (
                  <TableActionButton tone="slate" onClick={() => onReject(row)}>
                    <CloseIcon size={14} />
                    Reject
                  </TableActionButton>
                )}
                {row.releaseStatus === "pending_final_approval" && onFinalApprove && (
                  <TableActionButton tone="amber" onClick={() => onFinalApprove(row)}>
                    <CheckIcon size={14} />
                    Sign &amp; final approve
                  </TableActionButton>
                )}
                {row.releaseStatus === "pending_final_approval" && onReturnForRevision && (
                  <TableActionButton tone="slate" onClick={() => onReturnForRevision(row)}>
                    <CloseIcon size={14} />
                    Return for revision
                  </TableActionButton>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type YearCohort = { yearLevel: number; releases: ScheduleRelease[]; sessions: number };
type ProgramGroup = { programId: number; abbrev: string; total: number; years: YearCohort[] };

/** Bucket pending releases into Program → Year-level cohorts, both sorted for stable display. */
function groupByProgramYear(releases: ScheduleRelease[]): ProgramGroup[] {
  const byProgram = new Map<string, { programId: number; years: Map<number, ScheduleRelease[]> }>();
  for (const release of releases) {
    const abbrev = release.programAbbrev ?? "—";
    const year = release.yearLevel ?? 0;
    const existing = byProgram.get(abbrev) ?? { programId: release.programId, years: new Map<number, ScheduleRelease[]>() };
    const rows = existing.years.get(year) ?? [];
    rows.push(release);
    existing.years.set(year, rows);
    byProgram.set(abbrev, existing);
  }

  return [...byProgram.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([abbrev, { programId, years }]) => {
      const cohorts: YearCohort[] = [...years.entries()]
        .sort(([a], [b]) => a - b)
        .map(([yearLevel, rows]) => ({
          yearLevel,
          releases: [...rows].sort((a, b) => (a.setCode ?? "").localeCompare(b.setCode ?? "")),
          sessions: rows.reduce((sum, r) => sum + r.sessionCount, 0),
        }));
      return { programId, abbrev, total: cohorts.reduce((sum, c) => sum + c.releases.length, 0), years: cohorts };
    });
}

type GroupedPendingProps = PendingTableProps & {
  /** Approve every section in a Program→Year cohort at once. */
  onSendCohort?: (label: string, releases: ScheduleRelease[]) => void;
  /** Atomic send whole program to instructors. */
  onSendProgram?: (programId: number, programAbbrev: string) => void;
  /** Atomic return whole program with reason. */
  onRejectProgram?: (programId: number, programAbbrev: string) => void;
  /** Program abbrev → full name + department code, for the group header logo/label. */
  programInfo?: Map<string, { name: string; departmentCode: string }>;
};

/**
 * Pending approvals grouped Program → Year level. Each cohort carries a rollup and an
 * "Approve all" so the dean can clear a whole year at once, while the per-row Review /
 * Approve / Reject controls stay exactly as before.
 */
export function GroupedPendingApprovals({
  releases,
  programInfo,
  onPreview,
  onSendToInstructors,
  onReject,
  onFinalApprove,
  onSendCohort,
  onSendProgram,
  onRejectProgram,
}: GroupedPendingProps) {
  const programs = useMemo(() => groupByProgramYear(releases), [releases]);

  return (
    <div className="flex flex-col gap-8">
      {programs.map((program) => (
        <section key={program.abbrev} aria-label={program.abbrev}>
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={departmentLogoUrl(programInfo?.get(program.abbrev)?.departmentCode ?? "")}
                onError={onDepartmentLogoError}
                alt=""
                className="size-9 shrink-0 rounded-md object-contain"
              />
              <div className="min-w-0">
                <h3 className="truncate font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
                  {program.abbrev}
                  {programInfo?.get(program.abbrev)?.name && (
                    <span className="ml-2 font-body text-sm font-normal text-slate-500 dark:text-slate-400">
                      {programInfo.get(program.abbrev)?.name}
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onSendProgram && (
                <Button
                  type="button"
                  block={false}
                  onClick={() => onSendProgram(program.programId, program.abbrev)}
                >
                  <CheckIcon size={14} />
                  Send Program ({program.total})
                </Button>
              )}
              {onRejectProgram && (
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  onClick={() => onRejectProgram(program.programId, program.abbrev)}
                >
                  <CloseIcon size={14} />
                  Return Program
                </Button>
              )}
            </div>
          </Card>

          <div className="mt-4 flex flex-col gap-5">
            {program.years.map((cohort) => {
              const label = `${program.abbrev} Year ${cohort.yearLevel}`;
              return (
                <div key={cohort.yearLevel}>
                  <div className="mb-2.5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" aria-hidden="true" />
                    <span className="font-body text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-mist-200">
                      Year {cohort.yearLevel}
                    </span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" aria-hidden="true" />
                  </div>
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-x-1.5 font-body text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        <span className="font-semibold tabular-nums text-navy-700 dark:text-mist-100">
                          {cohort.releases.length}
                        </span>{" "}
                        section{cohort.releases.length === 1 ? "" : "s"}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                        ·
                      </span>
                      <span>
                        <span className="font-semibold tabular-nums text-navy-700 dark:text-mist-100">
                          {cohort.sessions}
                        </span>{" "}
                        session{cohort.sessions === 1 ? "" : "s"}
                      </span>
                    </span>
                    {onSendCohort && (
                      <Button
                        type="button"
                        variant="outline"
                        block={false}
                        onClick={() => onSendCohort(label, cohort.releases)}
                      >
                        <CheckIcon size={14} />
                        Send cohort ({cohort.releases.length})
                      </Button>
                    )}
                  </div>
                  <SchedulePendingApprovalsTable
                    releases={cohort.releases}
                    onPreview={onPreview}
                    onSendToInstructors={onSendToInstructors}
                    onReject={onReject}
                    onFinalApprove={onFinalApprove}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
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
        <TableHeader className="hidden lg:table-cell">Signature / Approver</TableHeader>
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
            <TableCell className="hidden lg:table-cell text-slate-600 dark:text-slate-300">
              {row.approvedBy ? (
                <span className="font-medium text-emerald-700 dark:text-emerald-300">
                  {row.approvedBy.name}
                </span>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="hidden lg:table-cell">{row.rejectionReason ?? row.submissionNote ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
