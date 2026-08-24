import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "~/features/schedules/schedule-view-toggle";
import type { Semester } from "~/types/semester";
import type { ScheduleSemester } from "~/types/schedule";

type MasterSchedulesTermBarProps = {
  schoolYears: string[];
  schoolYear: string;
  onSchoolYearChange: (sy: string) => void;
  semesters: Semester[];
  semestersLoading: boolean;
  semester: ScheduleSemester;
  onSemesterChange: (sem: ScheduleSemester) => void;
  semesterLabel: (n: number) => string;
  globalViewMode: ScheduleViewMode;
  onGlobalViewModeChange: (mode: ScheduleViewMode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  allExpanded: boolean;
  totalSections: number;
  totalClasses: number;
};

/** Compact Term and Global View controls bar for Master Schedules. */
export function MasterSchedulesTermBar({
  schoolYears,
  schoolYear,
  onSchoolYearChange,
  semesters,
  semestersLoading,
  semester,
  onSemesterChange,
  semesterLabel,
  globalViewMode,
  onGlobalViewModeChange,
  onExpandAll,
  onCollapseAll,
  allExpanded,
  totalSections,
  totalClasses,
}: MasterSchedulesTermBarProps) {
  const regularSemesters = semesters.filter((s) => s.semesterNumber !== 3);

  return (
    <Card className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
      {/* Left: Term Pickers */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-96">
        <FieldChrome id="ms-school-year" label="School Year">
          <Select
            items={
              schoolYears.length === 0
                ? [{ value: "", label: "No school year" }]
                : schoolYears.map((y) => ({ value: y, label: y }))
            }
            value={schoolYear}
            onValueChange={(v) => onSchoolYearChange(v as string)}
          >
            <SelectTrigger id="ms-school-year">
              <SelectValue placeholder="Select school year" />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.length === 0 ? (
                <SelectItem value="">No school year</SelectItem>
              ) : (
                schoolYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </FieldChrome>

        <FieldChrome id="ms-semester" label="Semester">
          <Select
            items={
              semestersLoading
                ? [{ value: "", label: "Loading…" }]
                : regularSemesters.length === 0
                  ? [{ value: "", label: "No semester" }]
                  : regularSemesters.map((s) => ({
                      value: String(s.semesterNumber),
                      label: semesterLabel(s.semesterNumber),
                    }))
            }
            value={semestersLoading ? "" : String(semester)}
            onValueChange={(v) => onSemesterChange(Number(v) as ScheduleSemester)}
          >
            <SelectTrigger id="ms-semester">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {semestersLoading ? (
                <SelectItem value="">Loading…</SelectItem>
              ) : regularSemesters.length === 0 ? (
                <SelectItem value="">No semester</SelectItem>
              ) : (
                regularSemesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.semesterNumber)}>
                    {semesterLabel(s.semesterNumber)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      {/* Right: Metrics & Global View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 lg:justify-end lg:pt-0">
        <div className="flex items-center gap-2 font-body text-xs text-slate-500 dark:text-slate-400">
          <span>
            <strong className="font-semibold text-navy-800 dark:text-mist-100">{totalSections}</strong> section
            {totalSections === 1 ? "" : "s"}
          </span>
          <span>·</span>
          <span>
            <strong className="font-semibold text-navy-800 dark:text-mist-100">{totalClasses}</strong> class
            {totalClasses === 1 ? "" : "es"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            block={false}
            onClick={allExpanded ? onCollapseAll : onExpandAll}
          >
            {allExpanded ? "Collapse All" : "Expand All"}
          </Button>

          <ScheduleViewToggle value={globalViewMode} onChange={onGlobalViewModeChange} />
        </div>
      </div>
    </Card>
  );
}
