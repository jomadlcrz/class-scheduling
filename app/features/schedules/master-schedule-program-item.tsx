import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CheckIcon, RotateIcon, SendIcon } from "~/components/ui/icons";
import { MasterScheduleYearItem } from "~/features/schedules/master-schedule-year-item";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
  StatusBadge,
} from "~/features/academic-terms/status-badges";
import { ScheduleLifecycleRail } from "~/features/schedules/schedule-lifecycle-rail";
import type { Schedule } from "~/types/schedule";
import type { ScheduleRelease, ScheduleReleaseStatus } from "~/types/schedule-release";
import type { Department } from "~/types/department";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";

const RELEASE_PROGRESS: Record<ScheduleReleaseStatus, number> = {
  draft: 0,
  rejected: 0,
  pending_dean_review: 1,
  instructor_review: 2,
  registrar_revision: 3,
  pending_final_approval: 4,
  approved: 5,
};

function representativeRelease(
  sets: { release: ScheduleRelease | null; schedules: Schedule[] }[],
  programAbbrev: string,
  totalClasses: number,
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

type MasterScheduleProgramItemProps = {
  abbrev: string;
  name: string;
  programId?: number;
  yearGroups: YearGroupData[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  openYearLevels: Set<string>;
  onToggleYearLevel: (yearKey: string, open: boolean) => void;
  openSets: Set<string>;
  onToggleSet: (setCode: string, open: boolean) => void;
  globalViewMode: ScheduleViewMode;
  schoolYear: string;
  semesterLabel: string;
  termClosed: boolean;
  departments: Department[];
  onEdit: (schedule: Schedule) => void;
  onSubmitRelease: (release: ScheduleRelease) => void;
  onWithdrawRelease: (release: ScheduleRelease) => void;
  onClearSet: (setId: number, setCode: string) => void;
  onSendProgram?: (programId: number, programAbbrev: string) => void;
  onWithdrawProgram?: (programId: number, programAbbrev: string) => void;
  onPublishProgram?: (programId: number, programAbbrev: string) => void;
};

/** Accordion item for a program, containing its year levels and sets. */
export function MasterScheduleProgramItem({
  abbrev,
  name,
  programId,
  yearGroups,
  isOpen,
  onOpenChange,
  openYearLevels,
  onToggleYearLevel,
  openSets,
  onToggleSet,
  globalViewMode,
  schoolYear,
  semesterLabel,
  termClosed,
  departments,
  onEdit,
  onSubmitRelease,
  onWithdrawRelease,
  onClearSet,
  onSendProgram,
  onWithdrawProgram,
  onPublishProgram,
}: MasterScheduleProgramItemProps) {
  const allSets = yearGroups.flatMap((y) => y.sets);
  const totalSets = allSets.length;
  const totalClasses = allSets.reduce((acc, s) => acc + s.schedules.length, 0);

  // Status counts for this program
  const statusCounts = allSets.reduce<Record<string, number>>((acc, curr) => {
    if (curr.release?.releaseStatus) {
      const status = curr.release.releaseStatus;
      acc[status] = (acc[status] ?? 0) + 1;
    }
    return acc;
  }, {});

  const hasDrafts = (statusCounts["draft"] ?? 0) + (statusCounts["rejected"] ?? 0) > 0 ||
    allSets.some((s) => !s.release && s.schedules.length > 0);
  const isPendingDean = (statusCounts["pending_dean_review"] ?? 0) > 0;
  const allApproved = totalSets > 0 && (statusCounts["approved"] ?? 0) === totalSets;
  const isPublished = allSets.every((s) => s.release?.publishedAt != null);

  const statusOrder: ScheduleReleaseStatus[] = [
    "approved",
    "pending_final_approval",
    "registrar_revision",
    "instructor_review",
    "pending_dean_review",
    "rejected",
    "draft",
  ];

  const stepperRelease = representativeRelease(allSets, abbrev, totalClasses);

  return (
    <AccordionItem
      variant="boxed"
      open={isOpen}
      onOpenChange={onOpenChange}
      title={
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
            {abbrev}
          </span>
          {name && (
            <span className="font-body text-xs text-slate-500 dark:text-slate-400">
              — {name}
            </span>
          )}
        </div>
      }
      adornment={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="slate">
            {totalSets} section{totalSets === 1 ? "" : "s"}
          </Badge>
          <span className="hidden font-body text-xs text-slate-400 sm:inline">·</span>
          <span className="hidden font-body text-xs text-slate-500 sm:inline dark:text-slate-400">
            {totalClasses} class{totalClasses === 1 ? "" : "es"}
          </span>
          {statusOrder.map((st) =>
            statusCounts[st] ? (
              <StatusBadge key={st} tone={scheduleReleaseStatusTone(st)}>
                {statusCounts[st]} {scheduleReleaseStatusLabel(st)}
              </StatusBadge>
            ) : null,
          )}
          {!termClosed && programId != null && onSendProgram && hasDrafts && (
            <Button
              type="button"
              block={false}
              className="ml-1 text-xs"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onSendProgram(programId, abbrev);
              }}
            >
              <SendIcon />
              Submit {abbrev} to Dean
            </Button>
          )}
          {!termClosed && programId != null && onWithdrawProgram && isPendingDean && (
            <Button
              type="button"
              variant="outline"
              block={false}
              className="ml-1 text-xs"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onWithdrawProgram(programId, abbrev);
              }}
            >
              <RotateIcon />
              Withdraw {abbrev}
            </Button>
          )}
          {!termClosed && programId != null && onPublishProgram && allApproved && !isPublished && (
            <Button
              type="button"
              block={false}
              className="ml-1 text-xs"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onPublishProgram(programId, abbrev);
              }}
            >
              <CheckIcon />
              Publish Schedule
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-3 sm:p-5">
        <div className="mb-2">
          <ScheduleLifecycleRail release={stepperRelease} audience="registrar" />
        </div>
        {yearGroups.length === 0 ? (
          <p className="py-4 text-center font-body text-xs text-slate-500 dark:text-slate-400">
            No sections or schedules found for {abbrev}.
          </p>
        ) : (
          <Accordion>
            {yearGroups.map((yearGroup) => {
              const yearKey = `${abbrev}-${yearGroup.yearLevel}`;
              return (
                <MasterScheduleYearItem
                  key={yearKey}
                  yearLevel={yearGroup.yearLevel}
                  yearLabel={yearGroup.yearLabel}
                  sets={yearGroup.sets}
                  isOpen={openYearLevels.has(yearKey)}
                  onOpenChange={(open) => onToggleYearLevel(yearKey, open)}
                  openSets={openSets}
                  onToggleSet={onToggleSet}
                  globalViewMode={globalViewMode}
                  schoolYear={schoolYear}
                  semesterLabel={semesterLabel}
                  termClosed={termClosed}
                  departments={departments}
                  onEdit={onEdit}
                  onSubmitRelease={onSubmitRelease}
                  onWithdrawRelease={onWithdrawRelease}
                  onClearSet={onClearSet}
                />
              );
            })}
          </Accordion>
        )}
      </div>
    </AccordionItem>
  );
}
