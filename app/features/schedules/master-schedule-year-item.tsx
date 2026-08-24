import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { MasterScheduleSetItem } from "~/features/schedules/master-schedule-set-item";
import type { Schedule } from "~/types/schedule";
import type { ScheduleRelease } from "~/types/schedule-release";
import type { Department } from "~/types/department";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";

type MasterScheduleYearItemProps = {
  yearLevel: number;
  yearLabel: string;
  sets: {
    setCode: string;
    schedules: Schedule[];
    release: ScheduleRelease | null;
    scheduledSetId?: number | null;
  }[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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

/** Accordion item for a single year level grouping (e.g. 1st Year), containing its sets. */
export function MasterScheduleYearItem({
  yearLevel: _yearLevel,
  yearLabel,
  sets,
  isOpen,
  onOpenChange,
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
}: MasterScheduleYearItemProps) {
  const totalClasses = sets.reduce((acc, s) => acc + s.schedules.length, 0);

  return (
    <AccordionItem
      variant="flat"
      open={isOpen}
      onOpenChange={onOpenChange}
      title={
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-body text-sm font-bold uppercase tracking-wider text-navy-700 dark:text-mist-200">
            {yearLabel}
          </span>
          <span className="font-body text-xs text-slate-500 dark:text-slate-400">
            {sets.length} section{sets.length === 1 ? "" : "s"} · {totalClasses} class{totalClasses === 1 ? "" : "es"}
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-2 border-l-2 border-slate-200 py-2 pl-3 sm:pl-4 dark:border-white/10">
        <Accordion>
          {sets.map((set) => (
            <MasterScheduleSetItem
              key={set.setCode}
              setCode={set.setCode}
              schedules={set.schedules}
              release={set.release}
              isOpen={openSets.has(set.setCode)}
              onOpenChange={(open) => onToggleSet(set.setCode, open)}
              globalViewMode={globalViewMode}
              schoolYear={schoolYear}
              semesterLabel={semesterLabel}
              termClosed={termClosed}
              departments={departments}
              onEdit={onEdit}
              onSubmitRelease={onSubmitRelease}
              onWithdrawRelease={onWithdrawRelease}
              onClearSet={onClearSet}
              scheduledSetId={set.scheduledSetId}
            />
          ))}
        </Accordion>
      </div>
    </AccordionItem>
  );
}
