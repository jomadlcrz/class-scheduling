import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { MasterScheduleYearItem } from "~/features/schedules/master-schedule-year-item";
import {
  scheduleReleaseStatusLabel,
  scheduleReleaseStatusTone,
  StatusBadge,
} from "~/features/academic-terms/status-badges";
import type { Schedule } from "~/types/schedule";
import type { ScheduleRelease, ScheduleReleaseStatus } from "~/types/schedule-release";
import type { Department } from "~/types/department";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";

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
};

/** Accordion item for a program, containing its year levels and sets. */
export function MasterScheduleProgramItem({
  abbrev,
  name,
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

  const statusOrder: ScheduleReleaseStatus[] = [
    "approved",
    "pending_dean_review",
    "rejected",
    "draft",
  ];

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
        <div className="flex flex-wrap items-center gap-1.5">
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
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-3 sm:p-5">
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
