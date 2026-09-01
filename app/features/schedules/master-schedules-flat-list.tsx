import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ChevronRightIcon, EditIcon, PrinterIcon, RotateIcon, SendIcon, TrashIcon } from "~/components/ui/icons";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
  StatusBadge,
} from "~/features/academic-terms/status-badges";
import { SchedulePreviewModal } from "~/features/schedules/schedule-preview-modal";
import { openSchedulePrint } from "~/features/schedules/print-schedule";
import { useDays } from "~/hooks/use-days";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import type { Schedule } from "~/types/schedule";
import type { ScheduleRelease } from "~/types/schedule-release";
import type { Department } from "~/types/department";
import { departmentService } from "~/services/department.service";

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
  onEdit: (schedule: Schedule) => void;
  onSubmitRelease: (release: ScheduleRelease) => void;
  onWithdrawRelease: (release: ScheduleRelease) => void;
  onClearSet: (setId: number, setCode: string) => void;
  onSendProgram?: (programId: number, programAbbrev: string) => void;
  onWithdrawProgram?: (programId: number, programAbbrev: string) => void;
  onPublishProgram?: (programId: number, programAbbrev: string) => void;
};

const STATUS_ORDER = [
  "approved",
  "pending_final_approval",
  "registrar_revision",
  "instructor_review",
  "pending_dean_review",
  "rejected",
  "draft",
] as const;

function SetRow({
  release,
  schedules,
  programAbbrev,
  termClosed,
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
            View Timetable
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
            className="text-xs"
            onClick={() => onSubmitRelease(effectiveRelease)}
          >
            <SendIcon />
          </Button>
        )}
        {!termClosed && effectiveRelease?.releaseStatus !== "draft" && effectiveRelease?.releaseStatus !== "approved" && (
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
}: {
  group: ProgramFlatData;
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

  const hasDrafts = (statusCounts["draft"] ?? 0) + (statusCounts["rejected"] ?? 0) > 0 ||
    allSets.some((s) => !s.release && s.schedules.length > 0);
  const isPendingDean = (statusCounts["pending_dean_review"] ?? 0) > 0;
  const allApproved = totalSets > 0 && (statusCounts["approved"] ?? 0) === totalSets;
  const isPublished = allSets.every((s) => s.release?.publishedAt != null);

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
            className={`shrink-0 text-slate-400 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
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
            <div className="mt-0.5 block font-body text-xs text-slate-500 dark:text-slate-400">
              {totalSets} section{totalSets === 1 ? "" : "s"} · {totalClasses} class{totalClasses === 1 ? "" : "es"}
            </div>
          </div>
        </button>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!termClosed && group.programId != null && onSendProgram && hasDrafts && (
            <Button
              type="button"
              block={false}
              className="text-xs"
              onClick={() => onSendProgram(group.programId!, group.abbrev)}
            >
              <SendIcon />
              Submit to Dean
            </Button>
          )}
          {!termClosed && group.programId != null && onWithdrawProgram && isPendingDean && (
            <Button
              type="button"
              variant="outline"
              block={false}
              className="text-xs"
              onClick={() => onWithdrawProgram(group.programId!, group.abbrev)}
            >
              <RotateIcon />
              Withdraw
            </Button>
          )}
          {!termClosed && group.programId != null && onPublishProgram && allApproved && !isPublished && (
            <Button
              type="button"
              block={false}
              className="text-xs"
              onClick={() => onPublishProgram(group.programId!, group.abbrev)}
            >
              Publish Schedule
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="p-4">
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

/** Flat card-based list for Master Schedules — replaces deeply nested accordions. */
export function MasterSchedulesFlatList({
  programs,
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
          onEdit={onEdit}
          onSubmitRelease={onSubmitRelease}
          onWithdrawRelease={onWithdrawRelease}
          onClearSet={onClearSet}
          onSendProgram={onSendProgram}
          onWithdrawProgram={onWithdrawProgram}
          onPublishProgram={onPublishProgram}
        />
      ))}
    </div>
  );
}
