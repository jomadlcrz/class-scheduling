import { Accordion } from "~/components/ui/accordion";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";
import { MasterScheduleProgramItem } from "~/features/schedules/master-schedule-program-item";
import type { Schedule } from "~/types/schedule";
import type { ScheduleRelease } from "~/types/schedule-release";
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

export type ProgramTreeData = {
  abbrev: string;
  name: string;
  departmentAbbrev: string;
  yearGroups: YearGroupData[];
};

type MasterSchedulesTreeProps = {
  programs: ProgramTreeData[];
  openPrograms: Set<string>;
  onToggleProgram: (programAbbrev: string, open: boolean) => void;
  openYearLevels: Set<string>;
  onToggleYearLevel: (yearKey: string, open: boolean) => void;
  openSets: Set<string>;
  onToggleSet: (setCode: string, open: boolean) => void;
  globalViewMode: ScheduleViewMode;
  schoolYear: string;
  semesterLabel: string;
  termClosed: boolean;
  departments: Department[];
  onCreateSchedule: () => void;
  onEdit: (schedule: Schedule) => void;
  onSubmitRelease: (release: ScheduleRelease) => void;
  onWithdrawRelease: (release: ScheduleRelease) => void;
  onClearSet: (setId: number, setCode: string) => void;
};

/** The full department/program accordion tree for Master Schedules. */
export function MasterSchedulesTree({
  programs,
  openPrograms,
  onToggleProgram,
  openYearLevels,
  onToggleYearLevel,
  openSets,
  onToggleSet,
  globalViewMode,
  schoolYear,
  semesterLabel,
  termClosed,
  departments,
  onCreateSchedule,
  onEdit,
  onSubmitRelease,
  onWithdrawRelease,
  onClearSet,
}: MasterSchedulesTreeProps) {
  if (programs.length === 0) {
    return (
      <EmptyState
        title="No schedules found"
        action={
          <Button type="button" block={false} onClick={onCreateSchedule}>
            <PlusIcon />
            Create Schedule
          </Button>
        }
      >
        No class schedules match the selected department or term. Create a schedule to get started.
      </EmptyState>
    );
  }

  return (
    <Accordion>
      {programs.map((program) => (
        <MasterScheduleProgramItem
          key={program.abbrev}
          abbrev={program.abbrev}
          name={program.name}
          yearGroups={program.yearGroups}
          isOpen={openPrograms.has(program.abbrev)}
          onOpenChange={(open) => onToggleProgram(program.abbrev, open)}
          openYearLevels={openYearLevels}
          onToggleYearLevel={onToggleYearLevel}
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
      ))}
    </Accordion>
  );
}
