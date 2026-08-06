import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { AcademicDraft } from "~/features/enrollment/add-student-step2-academic";
import { EnrolledStatusPicker } from "~/features/enrollment/enrolled-status-picker";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";

type ReenrollStep2EnrollmentProps = {
  academic: AcademicDraft;
  onAcademicChange: (patch: Partial<AcademicDraft>) => void;
  programs: Program[];
  sets: ClassSet[];
  schoolYears: SchoolYearOption[];
  semesters: Semester[];
  studentTypes: string[];
  academicStatuses: string[];
  canAdvance: boolean;
  onNext: () => void;
  onBack: () => void;
};

export function ReenrollStep2Enrollment({
  academic,
  onAcademicChange,
  programs,
  sets,
  schoolYears,
  semesters,
  studentTypes,
  academicStatuses,
  canAdvance,
  onNext,
  onBack,
}: ReenrollStep2EnrollmentProps) {
  const { yearLevelIds, yearLevelLabel } = useYearLevels();
  const selectedProgram = programs.find((p) => String(p.id) === academic.programId);
  const isIrregular = academic.enrolledStatus === "Irregular";

  const yearOptions = yearLevelIds.filter((y) => y <= (selectedProgram?.lengthYears ?? 6));
  const filteredSets = selectedProgram
    ? sets.filter(
        (s) => s.program === selectedProgram.abbrev && (!academic.yearLevel || String(s.yearLevel) === academic.yearLevel),
      )
    : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldChrome id="reenroll-program" label="Program" required>
          <Select
            items={[{ value: "", label: "Select a program" }, ...programs.map((p) => ({ value: String(p.id), label: `${p.abbrev} — ${p.name}` }))]}
            value={academic.programId}
            onValueChange={(v) => onAcademicChange({ programId: v as string })}
          >
            <SelectTrigger id="reenroll-program">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a program</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.abbrev} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>

        <FieldChrome id="reenroll-year" label="Year Level" required>
          <Select
            items={[{ value: "", label: "Select a year" }, ...yearOptions.map((y) => ({ value: String(y), label: yearLevelLabel(y) }))]}
            value={academic.yearLevel}
            onValueChange={(v) => onAcademicChange({ yearLevel: v as string })}
          >
            <SelectTrigger id="reenroll-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a year</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {yearLevelLabel(y)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      <EnrolledStatusPicker
        value={academic.enrolledStatus}
        options={academicStatuses}
        onChange={(v) => onAcademicChange({ enrolledStatus: v, setId: "" })}
      />

      <div className={`grid gap-3 ${isIrregular ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        <FieldChrome id="reenroll-type" label="Student Type" required>
          <Select
            items={[{ value: "", label: "Select a type" }, ...studentTypes.map((t) => ({ value: t, label: t }))]}
            value={academic.studentType}
            onValueChange={(v) => onAcademicChange({ studentType: v as string })}
          >
            <SelectTrigger id="reenroll-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a type</SelectItem>
              {studentTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>

        {!isIrregular && (
          <FieldChrome id="reenroll-set" label="Class Set" required hint="Required for Regular students">
            <Select
              items={[{ value: "", label: "Select a set" }, ...filteredSets.map((s) => ({ value: String(s.id), label: s.setCode }))]}
              value={academic.setId}
              onValueChange={(v) => onAcademicChange({ setId: v as string })}
            >
              <SelectTrigger id="reenroll-set">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select a set</SelectItem>
                {filteredSets.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.setCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldChrome>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldChrome id="reenroll-sy" label="School Year" required>
          <Select
            items={[{ value: "", label: "Select a school year" }, ...schoolYears.map((sy) => ({ value: String(sy.id), label: sy.schoolYear }))]}
            value={academic.syId}
            onValueChange={(v) => onAcademicChange({ syId: v as string })}
          >
            <SelectTrigger id="reenroll-sy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a school year</SelectItem>
              {schoolYears.map((sy) => (
                <SelectItem key={sy.id} value={String(sy.id)}>
                  {sy.schoolYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>

        <FieldChrome id="reenroll-sem" label="Semester" required>
          <Select
            items={[{ value: "", label: "Select a semester" }, ...semesters.map((s) => ({ value: String(s.semesterNumber), label: s.semester }))]}
            value={academic.semesterNumber}
            onValueChange={(v) => onAcademicChange({ semesterNumber: v as string })}
          >
            <SelectTrigger id="reenroll-sem">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a semester</SelectItem>
              {semesters.map((s) => (
                <SelectItem key={s.semesterNumber} value={String(s.semesterNumber)}>
                  {s.semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </div>

      <ProgramWizardFooter
        backLabel="Back: Select Student"
        onBack={onBack}
        primaryLabel="Next: Review & Confirm"
        onPrimary={onNext}
        primaryDisabled={!canAdvance}
      />
    </div>
  );
}
