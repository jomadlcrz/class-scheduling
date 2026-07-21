import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { Program } from "~/types/program";
import type { ScheduleSemester } from "~/types/schedule";
import type { ClassSet } from "~/types/set";
import type { Semester } from "~/types/semester";
import type { YearLevel } from "~/types/subject";

type ScheduleContextFormProps = {
  schoolYears: SchoolYearOption[];
  schoolYear: string;
  onSchoolYearChange: (schoolYear: string) => void;
  onAddSchoolYear: () => void;

  semesters: Semester[];
  semester: ScheduleSemester;
  onSemesterChange: (semester: ScheduleSemester) => void;
  semesterLabel: (n: number) => string;

  programs: Program[] | null;
  selectedProgramId: string;
  onProgramChange: (programId: string) => void;

  availableYearLevels: YearLevel[];
  selectedYearLevel: YearLevel | "";
  onYearLevelChange: (yearLevel: YearLevel | "") => void;
  yearLevelLabel: (n: number) => string;

  availableSets: ClassSet[];
  selectedSetId: string;
  onSetIdChange: (setId: string) => void;

  /** Once slots exist (or a save/generate is in flight), the context can't change without clearing them first. */
  locked: boolean;
  lockHint?: string;
};

/** The school year / semester / program / year level / set picker that establishes what's being scheduled. */
export function ScheduleContextForm({
  schoolYears,
  schoolYear,
  onSchoolYearChange,
  onAddSchoolYear,
  semesters,
  semester,
  onSemesterChange,
  semesterLabel,
  programs,
  selectedProgramId,
  onProgramChange,
  availableYearLevels,
  selectedYearLevel,
  onYearLevelChange,
  yearLevelLabel,
  availableSets,
  selectedSetId,
  onSetIdChange,
  locked,
  lockHint,
}: ScheduleContextFormProps) {
  return (
    <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
      <FieldChrome
        id="sn-school-year"
        label="School Year"
        labelEnd={
          <button
            type="button"
            onClick={onAddSchoolYear}
            disabled={locked}
            className="font-body text-xs font-medium text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-blue-400"
          >
            + Add new
          </button>
        }
        hint={lockHint}
      >
        <Select
          items={[
            {
              value: "",
              label: schoolYears.length === 0 ? "No school years yet" : "Select a school year",
            },
            ...schoolYears.map((sy) => ({ value: sy.schoolYear, label: sy.schoolYear })),
          ]}
          value={schoolYear}
          onValueChange={(v) => onSchoolYearChange(v as string)}
          disabled={locked}
        >
          <SelectTrigger id="sn-school-year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              {schoolYears.length === 0 ? "No school years yet" : "Select a school year"}
            </SelectItem>
            {schoolYears.map((sy) => (
              <SelectItem key={sy.id} value={sy.schoolYear}>
                {sy.schoolYear}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
      <FieldChrome id="sn-semester" label="Semester">
        <Select
          items={semesters
            .filter((s) => s.semesterNumber !== 3)
            .map((s) => ({ value: String(s.semesterNumber), label: semesterLabel(s.semesterNumber) }))}
          value={String(semester)}
          onValueChange={(v) => onSemesterChange(Number(v) as ScheduleSemester)}
          disabled={locked}
        >
          <SelectTrigger id="sn-semester">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {semesters.filter((s) => s.semesterNumber !== 3).map((s) => (
              <SelectItem key={s.id} value={String(s.semesterNumber)}>
                {semesterLabel(s.semesterNumber)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
      <FieldChrome id="sn-program" label="Program">
        <Select
          items={[
            { value: "", label: "Select a program" },
            ...(programs ?? []).map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
          ]}
          value={selectedProgramId}
          onValueChange={(v) => onProgramChange(v as string)}
          disabled={locked}
        >
          <SelectTrigger id="sn-program">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Select a program</SelectItem>
            {(programs ?? []).map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.code} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
      <FieldChrome id="sn-year-level" label="Year Level">
        <Select
          items={[
            {
              value: "",
              label: availableYearLevels.length === 0 ? "Select a program first" : "Select a year level",
            },
            ...availableYearLevels.map((yl) => ({ value: String(yl), label: yearLevelLabel(yl) })),
          ]}
          value={String(selectedYearLevel)}
          onValueChange={(v) => onYearLevelChange(v === "" ? "" : (Number(v) as YearLevel))}
          disabled={locked}
        >
          <SelectTrigger id="sn-year-level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              {availableYearLevels.length === 0 ? "Select a program first" : "Select a year level"}
            </SelectItem>
            {availableYearLevels.map((yl) => (
              <SelectItem key={yl} value={String(yl)}>
                {yearLevelLabel(yl)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
      <FieldChrome id="sn-set" label="Set">
        <Select
          items={[
            {
              value: "",
              label: availableSets.length === 0 ? "Select a year level first" : "Select a set",
            },
            ...availableSets.map((s) => ({
              value: String(s.id),
              label: `${s.program}-${s.yearLevel}${s.setCode}`,
            })),
          ]}
          value={selectedSetId}
          onValueChange={(v) => onSetIdChange(v as string)}
          disabled={locked}
        >
          <SelectTrigger id="sn-set">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              {availableSets.length === 0 ? "Select a year level first" : "Select a set"}
            </SelectItem>
            {availableSets.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.program}-{s.yearLevel}{s.setCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>
    </Card>
  );
}
