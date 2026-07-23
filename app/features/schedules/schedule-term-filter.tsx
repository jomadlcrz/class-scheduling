import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { ScheduleSemester } from "~/types/schedule";
import type { Semester } from "~/types/semester";

type ScheduleTermFilterProps = {
  /** Distinguishes element ids between pages that render this filter more than once. */
  idPrefix: string;

  isLoading: boolean;
  schoolYears: string[];
  schoolYear: string;
  onSchoolYearChange: (schoolYear: string) => void;

  semestersLoading: boolean;
  semesters: Semester[];
  semester: ScheduleSemester;
  onSemesterChange: (semester: ScheduleSemester) => void;
  semesterLabel: (n: number) => string;
};

/** School year + semester picker for "my schedule" pages, defaulting to whatever term the data has loaded. */
export function ScheduleTermFilter({
  idPrefix,
  isLoading,
  schoolYears,
  schoolYear,
  onSchoolYearChange,
  semestersLoading,
  semesters,
  semester,
  onSemesterChange,
  semesterLabel,
}: ScheduleTermFilterProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
      <Select
        items={
          isLoading
            ? [{ value: "", label: "Loading…" }]
            : schoolYears.length === 0
              ? [{ value: "", label: "No classes yet" }]
              : schoolYears.map((y) => ({ value: y, label: y }))
        }
        value={schoolYear}
        onValueChange={(v) => onSchoolYearChange(v as string)}
      >
        <SelectTrigger id={`${idPrefix}-school-year`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="">Loading…</SelectItem>
          ) : schoolYears.length === 0 ? (
            <SelectItem value="">No classes yet</SelectItem>
          ) : (
            schoolYears.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <Select
        items={
          semestersLoading
            ? [{ value: "", label: "Loading…" }]
            : semesters
                .filter((s) => s.semesterNumber !== 3)
                .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))
        }
        value={semestersLoading ? "" : String(semester)}
        onValueChange={(v) => onSemesterChange(Number(v) as ScheduleSemester)}
      >
        <SelectTrigger id={`${idPrefix}-semester`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {semestersLoading ? (
            <SelectItem value="">Loading…</SelectItem>
          ) : (
            semesters
              .filter((s) => s.semesterNumber !== 3)
              .map((s) => (
                <SelectItem key={s.id} value={String(s.semesterNumber)}>
                  {semesterLabel(s.semesterNumber)}
                </SelectItem>
              ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
