import { AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { AccordionItem } from "~/components/ui/accordion";
import { PrinterIcon, RotateIcon, SendIcon, TrashIcon } from "~/components/ui/icons";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
} from "~/features/academic-terms/status-badges";
import { openSchedulePrint } from "~/features/schedules/print-schedule";
import { ScheduleGrid } from "~/features/schedules/schedule-grid";
import { ScheduleLifecycleRail } from "~/features/schedules/schedule-lifecycle-rail";
import { ScheduleTable } from "~/features/schedules/schedule-table";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import { getSlotDurationHours, type Schedule } from "~/types/schedule";
import type { ScheduleRelease } from "~/types/schedule-release";
import type { Department } from "~/types/department";
import { departmentService } from "~/services/department.service";

type MasterScheduleSetItemProps = {
  setCode: string;
  schedules: Schedule[];
  release: ScheduleRelease | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  globalViewMode: ScheduleViewMode;
  schoolYear: string;
  semesterLabel: string;
  termClosed: boolean;
  departments: Department[];
  onEdit: (schedule: Schedule) => void;
  onSubmitRelease: (release: ScheduleRelease) => void;
  onWithdrawRelease: (release: ScheduleRelease) => void;
  onClearSet: (setId: number, setCode: string) => void;
  scheduledSetId?: number | null;
};

/** Accordion item for a single class set (section), containing its timetable and lifecycle rail. */
export function MasterScheduleSetItem({
  setCode,
  schedules,
  release,
  isOpen,
  onOpenChange,
  globalViewMode,
  schoolYear,
  semesterLabel,
  termClosed,
  departments,
  onEdit,
  onSubmitRelease,
  onWithdrawRelease,
  onClearSet,
  scheduledSetId,
}: MasterScheduleSetItemProps) {
  const [localViewMode, setLocalViewMode] = useState<ScheduleViewMode | null>(null);
  const viewMode = localViewMode ?? globalViewMode;

  const totalUnits = useMemo(
    () => schedules.reduce((acc, curr) => acc + (curr.units ?? 0), 0),
    [schedules],
  );

  const totalHours = useMemo(
    () =>
      schedules.reduce((acc, curr) => {
        return acc + getSlotDurationHours(curr.startTime, curr.endTime);
      }, 0),
    [schedules],
  );

  const targetSetId = release?.setId ?? scheduledSetId;

  async function handlePrint() {
    if (schedules.length === 0) return;
    const availableDepartments =
      departments.length > 0 ? departments : await departmentService.listAcademic();
    const department = availableDepartments.find((item) =>
      item.programs.some((program) => program.abbrev === release?.programAbbrev),
    );
    let approvedBy: { name: string; position: string; departmentAbbrev?: string } | null = null;
    if (department) {
      try {
        const detail = await departmentService.getAcademicDetail(department.id);
        if (detail.dean) {
          approvedBy = {
            name: detail.dean.fullName,
            position: "Dean",
            departmentAbbrev: detail.departmentAbbrev,
          };
        }
      } catch {
        // Dean details optional for print
      }
    }

    openSchedulePrint(schedules, {
      schoolYear,
      semesterLabel,
      preparedBy: release?.submittedBy?.name
        ? { name: release.submittedBy.name, position: "Registrar" }
        : null,
      approvedBy,
    });
  }

  return (
    <AccordionItem
      variant="flat"
      open={isOpen}
      onOpenChange={onOpenChange}
      title={
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
            {setCode}
          </span>
          {release && (
            <Badge tone={scheduleReleaseStatusTone(release.releaseStatus)}>
              {scheduleReleaseStatusLabel(release.releaseStatus)}
            </Badge>
          )}
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">
            {schedules.length} class{schedules.length === 1 ? "" : "es"}
            {totalHours > 0 ? ` · ${totalHours} hrs` : ""}
            {totalUnits > 0 ? ` · ${totalUnits} units` : ""}
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-2 py-3 sm:px-4">
        {release && (
          <ScheduleLifecycleRail
            release={release}
            audience="registrar"
            action={
              release.releaseStatus === "draft" || release.releaseStatus === "rejected" ? (
                <Button
                  type="button"
                  block={false}
                  disabled={termClosed}
                  onClick={() => onSubmitRelease(release)}
                >
                  <SendIcon />
                  {release.releaseStatus === "rejected"
                    ? "Resubmit for Dean Review"
                    : "Submit for Dean Review"}
                </Button>
              ) : release.releaseStatus === "pending_dean_review" ? (
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  disabled={termClosed}
                  onClick={() => onWithdrawRelease(release)}
                >
                  <RotateIcon />
                  Withdraw
                </Button>
              ) : undefined
            }
          />
        )}

        {/* Set action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-white/5">
          <div className="flex items-center gap-2">
            <ScheduleViewToggle value={viewMode} onChange={setLocalViewMode} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              block={false}
              disabled={schedules.length === 0}
              onClick={handlePrint}
            >
              <PrinterIcon />
              Print Set
            </Button>
            {targetSetId != null && (
              <Button
                type="button"
                variant="outline"
                block={false}
                disabled={termClosed || schedules.length === 0}
                onClick={() => onClearSet(targetSetId, setCode)}
              >
                <TrashIcon />
                Clear Set
              </Button>
            )}
          </div>
        </div>

        {/* Timetable */}
        <AnimatePresence mode="wait">
          {schedules.length === 0 ? (
            <p className="py-6 text-center font-body text-xs text-slate-500 dark:text-slate-400">
              No classes scheduled for {setCode} yet.
            </p>
          ) : viewMode === "grid" ? (
            <ScheduleGrid schedules={schedules} onEdit={onEdit} />
          ) : (
            <ScheduleTable schedules={schedules} onEdit={onEdit} />
          )}
        </AnimatePresence>
      </div>
    </AccordionItem>
  );
}
