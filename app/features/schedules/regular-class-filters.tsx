import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { ScheduleSemester } from "~/types/schedule";
import type { Semester } from "~/types/semester";
import type { YearLevel } from "~/types/subject";

type RegularClassFiltersProps = {
  isLoading: boolean;
  schoolYears: string[];
  schoolYear: string;
  onSchoolYearChange: (schoolYear: string) => void;

  semesters: Semester[];
  semestersLoading: boolean;
  semester: ScheduleSemester;
  onSemesterChange: (semester: ScheduleSemester) => void;
  semesterLabel: (n: number) => string;

  /** Program abbreviations present in the loaded schedules. */
  programs: string[];
  selectedProgram: string;
  onProgramChange: (program: string) => void;
  /** Renders a program abbrev as "ABBR — Full Name" (falls back to the abbrev). */
  programLabel: (abbrev: string) => string;

  yearLevels: YearLevel[];
  selectedYearLevel: YearLevel | "";
  onYearLevelChange: (yearLevel: YearLevel | "") => void;
  yearLevelLabel: (n: number) => string;

  sets: string[];
  setName: string;
  onSetChange: (setName: string) => void;
};

/** School year → semester → program → year level → set cascade for the Regular Class page. */
export function RegularClassFilters({
  isLoading,
  schoolYears,
  schoolYear,
  onSchoolYearChange,
  semesters,
  semestersLoading,
  semester,
  onSemesterChange,
  semesterLabel,
  programs,
  selectedProgram,
  onProgramChange,
  programLabel,
  yearLevels,
  selectedYearLevel,
  onYearLevelChange,
  yearLevelLabel,
  sets,
  setName,
  onSetChange,
}: RegularClassFiltersProps) {
  return (
    <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
      <FieldChrome id="rc-school-year" label="School Year">
        <Select
          items={
            isLoading
              ? [{ value: "", label: "Loading…" }]
              : schoolYears.length === 0
                ? [{ value: "", label: "No school year" }]
                : schoolYears.map((y) => ({ value: y, label: y }))
          }
          value={schoolYear}
          onValueChange={(v) => onSchoolYearChange(v as string)}
        >
          <SelectTrigger id="rc-school-year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="">Loading…</SelectItem>
            ) : schoolYears.length === 0 ? (
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
      <FieldChrome id="rc-semester" label="Semester">
        <Select
          items={
            semestersLoading
              ? [{ value: "", label: "Loading…" }]
              : semesters.length === 0
                ? [{ value: "", label: "No semester" }]
                : semesters
                    .filter((s) => s.semesterNumber !== 3)
                    .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))
          }
          value={semestersLoading ? "" : String(semester)}
          onValueChange={(v) => onSemesterChange(Number(v) as ScheduleSemester)}
        >
          <SelectTrigger id="rc-semester">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {semestersLoading ? (
              <SelectItem value="">Loading…</SelectItem>
            ) : semesters.length === 0 ? (
              <SelectItem value="">No semester</SelectItem>
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
      </FieldChrome>
      <FieldChrome id="rc-program" label="Program">
        <Select
          items={[
            {
              value: "",
              label: isLoading
                ? "Loading…"
                : programs.length === 0
                  ? "No program"
                  : "Select a program",
            },
            ...programs.map((p) => ({ value: p, label: programLabel(p) })),
          ]}
          value={selectedProgram}
          onValueChange={(v) => onProgramChange(v as string)}
        >
          <SelectTrigger id="rc-program">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              {isLoading ? "Loading…" : programs.length === 0 ? "No program" : "Select a program"}
            </SelectItem>
            {programs.map((p) => (
              <SelectItem key={p} value={p}>
                {programLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
      <FieldChrome id="rc-year-level" label="Year Level">
        <Select
          items={[
            {
              value: "",
              label: !selectedProgram
                ? "Select a program first"
                : yearLevels.length === 0
                  ? "No year level"
                  : "Select a year level",
            },
            ...yearLevels.map((yl) => ({ value: String(yl), label: yearLevelLabel(yl) })),
          ]}
          value={selectedYearLevel === "" ? "" : String(selectedYearLevel)}
          onValueChange={(v) => onYearLevelChange(v === "" ? "" : (Number(v) as YearLevel))}
        >
          <SelectTrigger id="rc-year-level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              {!selectedProgram
                ? "Select a program first"
                : yearLevels.length === 0
                  ? "No year level"
                  : "Select a year level"}
            </SelectItem>
            {yearLevels.map((yl) => (
              <SelectItem key={yl} value={String(yl)}>
                {yearLevelLabel(yl)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
      <FieldChrome id="rc-set" label="Set">
        <Select
          items={[
            {
              value: "",
              label: isLoading
                ? "Loading…"
                : !selectedYearLevel
                  ? "Select a year level first"
                  : sets.length === 0
                    ? "No set"
                    : "Select a set",
            },
            ...sets.map((s) => ({ value: s, label: s })),
          ]}
          value={setName}
          onValueChange={(v) => onSetChange(v as string)}
        >
          <SelectTrigger id="rc-set">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              {isLoading
                ? "Loading…"
                : !selectedYearLevel
                  ? "Select a year level first"
                  : sets.length === 0
                    ? "No set"
                    : "Select a set"}
            </SelectItem>
            {sets.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
    </Card>
  );
}
