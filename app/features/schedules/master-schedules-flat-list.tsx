import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  CalendarIcon,
  ChevronRightIcon,
  EditIcon,
  RotateIcon,
  SendIcon,
  TrashIcon,
} from "~/components/ui/icons";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
  StatusBadge,
} from "~/features/academic-terms/status-badges";
import { ScheduleLifecycleRail } from "~/features/schedules/schedule-lifecycle-rail";
import { SchedulePreviewModal } from "~/features/schedules/schedule-preview-modal";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import type { Schedule } from "~/types/schedule";
import type { ScheduleRelease, ScheduleReleaseStatus } from "~/types/schedule-release";
import type { Department } from "~/types/department";
import type { DepartmentReadinessItem } from "~/types/term-phase";

type YearGroupData = {
  yearLevel: number;
  yearLabel: string;
  sets: {
    setCode: string;
    schedules: Schedule[];
    release: ScheduleRelease | null;
    scheduledSetId?: number | null;
  }[];
};

export type ProgramFlatData = {
  abbrev: string;
  name: string;
  departmentAbbrev: string;
  programId?: number;
  yearGroups: YearGroupData[];
};

type MasterSchedulesFlatListProps = {
  programs: ProgramFlatData[];
  schoolYear: string;
  semesterLabel: string;
  termClosed: boolean;
  departments: Department[];
  departmentReadinessMap?: Map<string, DepartmentReadinessItem>;
  onEdit: (schedule: Schedule) => void;
  onSubmitRelease: (release: ScheduleRelease) => void;
  onWithdrawRelease: (release: ScheduleRelease) => void;
  onClearSet: (setId: number, setCode: string) => void;
  onClearProgram?: (programAbbrev: string) => void;
  onSendProgram?: (programId: number, programAbbrev: string) => void;
  onWithdrawProgram?: (programId: number, programAbbrev: string) => void;
  onPublishProgram?: (programId: number, programAbbrev: string) => void;
};

const RELEASE_PROGRESS: Record<ScheduleReleaseStatus, number> = {
  draft: 0,
  rejected: 0,
  pending_dean_review: 1,
  instructor_review: 2,
  registrar_revision: 3,
  pending_final_approval: 4,
  approved: 5,
};

/** Pick the furthest-behind release among the sets to represent the program on the lifecycle rail. */
function representativeRelease(
  sets: { release: ScheduleRelease | null; schedules: Schedule[] }[],
  programAbbrev: string,
  totalClasses: number,
  schoolYear: string,
): ScheduleRelease {
  let best: ScheduleRelease | null = null;
  let bestRank = Number.POSITIVE_INFINITY;
  for (const s of sets) {
    if (!s.release) continue;
    const rank = RELEASE_PROGRESS[s.release.releaseStatus] ?? 0;
    if (rank < bestRank) {
      best = s.release;
      bestRank = rank;
    }
  }
  if (best) {
    return {
      ...best,
      sessionCount: totalClasses,
    };
  }
  return {
    id: 0,
    referenceCode: null,
    syId: 0,
    semesterNumber: 1,
    setId: 0,
    setCode: null,
    yearLevel: null,
    programId: 0,
    programAbbrev,
    releaseStatus: "draft",
    allowedTransitions: ["pending_dean_review"],
    sessionCount: totalClasses,
    subjectCount: 0,
    generatedMeetingCount: 0,
    majorMeetingCount: 0,
    tbaCount: 0,
    submissionNote: null,
    submittedAt: null,
    submittedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    approvedAt: null,
    termFinalized: false,
    publishedAt: null,
  };
}

function SetRow({
  release,
  schedules,
  programAbbrev,
  termClosed,
  canSend = true,
  onEdit,
  onSubmitRelease,
  onWithdrawRelease,
  onClearSet,
  onPreview,
}: {
  release: ScheduleRelease | null;
  schedules: Schedule[];
  programAbbrev: string;
  termClosed: boolean;
  canSend?: boolean;
  onEdit: (schedule: Schedule) => void;
  onSubmitRelease: (release: ScheduleRelease) => void;
  onWithdrawRelease: (release: ScheduleRelease) => void;
  onClearSet: (setId: number, setCode: string) => void;
  onPreview: (release: ScheduleRelease) => void;
}) {
  const setCode = release?.setCode ?? schedules[0]?.setCode ?? "";
  const sessionCount = release?.sessionCount ?? schedules.length;

  const effectiveRelease: ScheduleRelease | null = useMemo(() => {
    if (release) return release;
    if (schedules.length === 0) return null;
    const firstSched = schedules[0];
    return {
      id: Number(firstSched.setId) || 0,
      referenceCode: null,
      syId: 0,
      semesterNumber: 0,
      setId: Number(firstSched.setId) || 0,
      setCode,
      yearLevel: firstSched.yearLevel ?? null,
      programId: 0,
      programAbbrev,
      releaseStatus: "draft",
      allowedTransitions: ["pending_dean_review"],
      sessionCount: schedules.length,
      subjectCount: new Set(schedules.map((s) => s.subjectId)).size,
      generatedMeetingCount: schedules.length,
      majorMeetingCount: 0,
      tbaCount: 0,
      submissionNote: null,
      submittedAt: null,
      submittedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      approvedAt: null,
    };
  }, [release, schedules, setCode, programAbbrev]);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-navy-900">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="font-body text-sm font-medium text-navy-800 dark:text-mist-100">
          {setCode}
        </span>
        <Badge tone="slate">
          {sessionCount} session{sessionCount === 1 ? "" : "s"}
        </Badge>
        {effectiveRelease && (
          <StatusBadge tone={scheduleReleaseStatusTone(effectiveRelease.releaseStatus)}>
            {scheduleReleaseStatusLabel(effectiveRelease.releaseStatus)}
          </StatusBadge>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {effectiveRelease && (
          <Button
            type="button"
            variant="outline"
            block={false}
            className="text-xs"
            onClick={() => onPreview(effectiveRelease)}
          >
            View timetable
          </Button>
        )}
        {!termClosed && schedules.length > 0 && (
          <Button
            type="button"
            variant="outline"
            block={false}
            className="text-xs"
            onClick={() => onEdit(schedules[0])}
          >
            <EditIcon />
          </Button>
        )}
        {!termClosed && effectiveRelease?.releaseStatus === "draft" && (
          <Button
            type="button"
            variant="outline"
            block={false}
            disabled={!canSend}
            className="text-xs"
            onClick={() => {
              if (canSend) onSubmitRelease(effectiveRelease);
            }}
          >
            <SendIcon />
          </Button>
        )}
        {!termClosed &&
          effectiveRelease?.releaseStatus !== "draft" &&
          effectiveRelease?.releaseStatus !== "approved" && (
            <Button
              type="button"
              variant="outline"
              block={false}
              className="text-xs"
              onClick={() => onWithdrawRelease(effectiveRelease!)}
            >
              <RotateIcon />
            </Button>
          )}
        {!termClosed && effectiveRelease?.setId && (
          <Button
            type="button"
            variant="outline"
            block={false}
            className="text-xs"
            onClick={() => onClearSet(effectiveRelease.setId!, setCode)}
          >
            <TrashIcon />
          </Button>
        )}
      </div>
    </div>
  );
}

function ProgramCard({
  group,
  schoolYear,
  termClosed,
  departments,
  departmentReadinessMap,
  onEdit,
  onSubmitRelease,
  onWithdrawRelease,
  onClearSet,
  onClearProgram,
  onSendProgram,
  onWithdrawProgram,
  onPublishProgram,
}: {
  group: ProgramFlatData;
  schoolYear: string;
  semesterLabel: string;
  termClosed: boolean;
  departments: Department[];
  departmentReadinessMap?: Map<string, DepartmentReadinessItem>;
  onEdit: (schedule: Schedule) => void;
  onSubmitRelease: (release: ScheduleRelease) => void;
  onWithdrawRelease: (release: ScheduleRelease) => void;
  onClearSet: (setId: number, setCode: string) => void;
  onClearProgram?: (programAbbrev: string) => void;
  onSendProgram?: (programId: number, programAbbrev: string) => void;
  onWithdrawProgram?: (programId: number, programAbbrev: string) => void;
  onPublishProgram?: (programId: number, programAbbrev: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<ScheduleRelease | null>(null);

  const allSets = group.yearGroups.flatMap((y) => y.sets);
  const totalSets = allSets.length;
  const totalClasses = allSets.reduce((acc, s) => acc + s.schedules.length, 0);

  const statusCounts = allSets.reduce<Record<string, number>>((acc, curr) => {
    if (curr.release?.releaseStatus) {
      const status = curr.release.releaseStatus;
      acc[status] = (acc[status] ?? 0) + 1;
    }
    return acc;
  }, {});

  const programId = group.programId ?? null;
  const hasDrafts =
    (statusCounts["draft"] ?? 0) + (statusCounts["rejected"] ?? 0) > 0 ||
    allSets.some((s) => !s.release && s.schedules.length > 0);
  const isPendingDean = (statusCounts["pending_dean_review"] ?? 0) > 0;
  const allApproved = totalSets > 0 && (statusCounts["approved"] ?? 0) === totalSets;
  const isPublished = allSets.every((s) => s.release?.publishedAt != null);

  // Department readiness from term phase gate
  const deptReadiness =
    departmentReadinessMap?.get(group.departmentAbbrev.toUpperCase()) ??
    departmentReadinessMap?.get(
      String(departments.find((d) => d.abbrev === group.departmentAbbrev)?.id),
    );

  const canSend = deptReadiness ? deptReadiness.canSend : true;
  const blockedReason = deptReadiness?.blockedReason ?? null;

  // Stepper / lifecycle representative release
  const stepperRelease = useMemo(
    () => representativeRelease(allSets, group.abbrev, totalClasses, schoolYear),
    [allSets, group.abbrev, totalClasses, schoolYear],
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-white/10">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        >
          <span
            aria-hidden="true"
            className={`shrink-0 text-slate-400 transition-transform duration-150 ${
              open ? "rotate-90" : ""
            }`}
          >
            <ChevronRightIcon />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-display text-lg tracking-wide text-navy-800 dark:text-mist-100">
                {group.abbrev}
              </span>
              {group.name && (
                <span className="font-body text-sm text-slate-500 dark:text-slate-400">
                  — {group.name}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                {totalSets} section{totalSets === 1 ? "" : "s"} · {totalClasses} class{totalClasses === 1 ? "" : "es"}
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="font-body text-xs text-slate-400 dark:text-slate-500">
                Workflow:
              </span>
              <StatusBadge tone={scheduleReleaseStatusTone(stepperRelease.releaseStatus)}>
                {scheduleReleaseStatusLabel(stepperRelease.releaseStatus)}
              </StatusBadge>
              {deptReadiness && !deptReadiness.canSend && (
                <Badge tone="red" compact>
                  {blockedReason === "majors_still_open"
                    ? "Majors Open"
                    : blockedReason === "no_finalized_majors"
                      ? "Awaiting Majors"
                      : blockedReason === "schedules_incomplete"
                        ? `${deptReadiness.totalSets - deptReadiness.readyCount} Incomplete`
                        : "Blocked"}
                </Badge>
              )}
            </div>
          </div>
        </button>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!termClosed && programId != null && onSendProgram && hasDrafts && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                block={false}
                disabled={!canSend}
                className="text-xs"
                onClick={() => {
                  if (canSend) {
                    onSendProgram(programId, group.abbrev);
                  }
                }}
              >
                <SendIcon />
                Submit to Dean
              </Button>

              {!canSend && blockedReason === "majors_still_open" && (
                <Link
                  to="/schedules/term-calendar"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 font-body text-xs font-semibold text-amber-800 shadow-xs transition-colors hover:bg-amber-100 hover:text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/60"
                >
                  <CalendarIcon />
                  <span>Scheduling Calendar</span>
                  <ChevronRightIcon size={12} />
                </Link>
              )}

              {!canSend && blockedReason === "no_finalized_majors" && (
                <Link
                  to="/major-schedules"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 font-body text-xs font-semibold text-amber-800 shadow-xs transition-colors hover:bg-amber-100 hover:text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/60"
                >
                  <CalendarIcon />
                  <span>Major Schedules</span>
                  <ChevronRightIcon size={12} />
                </Link>
              )}

              {!canSend && blockedReason === "schedules_incomplete" && (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 font-body text-xs font-semibold text-red-800 shadow-xs transition-colors hover:bg-red-100 hover:text-red-950 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/60 cursor-pointer"
                >
                  <span>Finish Incomplete ({deptReadiness ? `${deptReadiness.readyCount}/${deptReadiness.totalSets}` : "Pending"})</span>
                  <ChevronRightIcon size={12} />
                </button>
              )}

              {!canSend && blockedReason === "nothing_to_send" && (
                <Link
                  to="/dean/department-schedules"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1.5 font-body text-xs font-semibold text-sky-800 shadow-xs transition-colors hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
                >
                  <span>Dean Approvals</span>
                  <ChevronRightIcon size={12} />
                </Link>
              )}

              {!canSend && blockedReason === "no_sets" && (
                <Link
                  to="/sets"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 font-body text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-200 dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
                >
                  <span>Manage Sets</span>
                  <ChevronRightIcon size={12} />
                </Link>
              )}
            </div>
          )}
          {!termClosed && programId != null && onWithdrawProgram && isPendingDean && (
            <Button
              type="button"
              variant="outline"
              block={false}
              className="text-xs"
              onClick={() => onWithdrawProgram(programId, group.abbrev)}
            >
              <RotateIcon />
              Withdraw
            </Button>
          )}
          {!termClosed && programId != null && onPublishProgram && allApproved && !isPublished && (
            <Button
              type="button"
              block={false}
              className="text-xs"
              onClick={() => onPublishProgram(programId, group.abbrev)}
            >
              Publish Schedule
            </Button>
          )}
          {!termClosed && onClearProgram && totalSets > 0 && (
            <Button
              type="button"
              variant="outline"
              block={false}
              className="text-xs"
              onClick={() => onClearProgram(group.abbrev)}
            >
              <TrashIcon />
              Clear
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="p-4 sm:p-5">
          {/* 5-Step Lifecycle Stepper / Wizard */}
          <div className="mb-4">
            <ScheduleLifecycleRail
              release={stepperRelease}
              audience="registrar"
            />
          </div>

          <div className="flex flex-col gap-4">
            {group.yearGroups.map((yearGroup) => (
              <section key={yearGroup.yearLevel} className="flex flex-col gap-2">
                <h3 className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                  {yearGroup.yearLabel}
                  <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                    ({yearGroup.sets.length} set{yearGroup.sets.length === 1 ? "" : "s"})
                  </span>
                </h3>
                <div className="flex flex-col gap-1.5">
                  {yearGroup.sets.map((set) => (
                    <SetRow
                      key={set.setCode}
                      release={set.release}
                      schedules={set.schedules}
                      programAbbrev={group.abbrev}
                      termClosed={termClosed}
                      canSend={canSend}
                      onEdit={onEdit}
                      onSubmitRelease={onSubmitRelease}
                      onWithdrawRelease={onWithdrawRelease}
                      onClearSet={onClearSet}
                      onPreview={(r) => setPreviewTarget(r)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      <SchedulePreviewModal
        open={previewTarget !== null}
        releaseId={previewTarget?.id ?? null}
        fetchPreview={scheduleReleaseService.getReleasePreview}
        onClose={() => setPreviewTarget(null)}
      />
    </Card>
  );
}

/** Flat card-based list for Master Schedules with workflow lifecycle stepper and readiness gates. */
export function MasterSchedulesFlatList({
  programs,
  schoolYear,
  semesterLabel,
  termClosed,
  departments,
  departmentReadinessMap,
  onEdit,
  onSubmitRelease,
  onWithdrawRelease,
  onClearSet,
  onClearProgram,
  onSendProgram,
  onWithdrawProgram,
  onPublishProgram,
}: MasterSchedulesFlatListProps) {
  if (programs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-body text-sm text-slate-500 dark:text-slate-400">
          No schedules found for this term.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {programs.map((program) => (
        <ProgramCard
          key={program.abbrev}
          group={program}
          schoolYear={schoolYear}
          semesterLabel={semesterLabel}
          termClosed={termClosed}
          departments={departments}
          departmentReadinessMap={departmentReadinessMap}
          onEdit={onEdit}
          onSubmitRelease={onSubmitRelease}
          onWithdrawRelease={onWithdrawRelease}
          onClearSet={onClearSet}
          onClearProgram={onClearProgram}
          onSendProgram={onSendProgram}
          onWithdrawProgram={onWithdrawProgram}
          onPublishProgram={onPublishProgram}
        />
      ))}
    </div>
  );
}
