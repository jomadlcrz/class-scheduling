import { Badge } from "~/components/ui/badge";
import type { AcademicDraft } from "~/features/enrollment/add-student-step2-academic";
import {
  EnrollmentSectionCard,
  InfoField,
} from "~/features/enrollment/enrollment-section-card";
import { IrregularSubjectPicker } from "~/features/enrollment/irregular-subject-picker";
import type { ReenrollDirectoryRow } from "~/features/enrollment/reenroll-step1-select-student";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { Program } from "~/types/program";
import type { Subject } from "~/types/subject";

type ReenrollStep3ReviewProps = {
  students: ReenrollDirectoryRow[];
  academic: AcademicDraft;
  programs: Program[];
  subjects: Subject[];
  selectedSubjectIds: Set<number>;
  onToggleSubject: (subjectId: number, checked: boolean) => void;
  isSaving: boolean;
  canSave: boolean;
  onBack: () => void;
  onSave: () => void;
};

export function ReenrollStep3Review({
  students,
  academic,
  programs,
  subjects,
  selectedSubjectIds,
  onToggleSubject,
  isSaving,
  canSave,
  onBack,
  onSave,
}: ReenrollStep3ReviewProps) {
  const { yearLevelLabel } = useYearLevels();
  const selectedProgram = programs.find((p) => String(p.id) === academic.programId);
  const isIrregular = academic.enrolledStatus === "Irregular";
  const semesterNumber = Number(academic.semesterNumber);

  const filteredSubjects = !selectedProgram
    ? []
    : isIrregular
      ? subjects.filter((s) => s.program === selectedProgram.abbrev && s.semester === semesterNumber)
      : subjects.filter(
          (s) =>
            s.program === selectedProgram.abbrev &&
            String(s.yearLevel) === academic.yearLevel &&
            s.semester === semesterNumber,
        );

  const selectedSubjects = filteredSubjects.filter((s) => selectedSubjectIds.has(s.id));
  const totalUnits = isIrregular
    ? selectedSubjects.reduce((sum, s) => sum + s.units, 0)
    : filteredSubjects.reduce((sum, s) => sum + s.units, 0);

  const programLabel = selectedProgram
    ? `${selectedProgram.abbrev} — ${selectedProgram.name}`
    : "";

  return (
    <div className="flex flex-col gap-5">
      <div className={`grid gap-5 ${isIrregular ? "lg:grid-cols-2" : ""}`}>
        {isIrregular ? (
          <IrregularSubjectPicker
            idPrefix="reenroll"
            subjects={filteredSubjects}
            selectedSubjectIds={selectedSubjectIds}
            onToggleSubject={onToggleSubject}
          />
        ) : null}

        <EnrollmentSectionCard title="Enrollment Summary">
          <dl className="grid gap-4">
            <InfoField label={`Student${students.length !== 1 ? "s" : ""} (${students.length})`}>
              {students.map((s) => s.name).join(", ") || "—"}
            </InfoField>
            <InfoField label="Program">{programLabel || "—"}</InfoField>
            <InfoField label="Year Level">
              {academic.yearLevel ? yearLevelLabel(Number(academic.yearLevel)) : "—"}
            </InfoField>
            <InfoField label="Enrolled Status">
              {academic.enrolledStatus ? (
                <Badge tone={isIrregular ? "gold" : "emerald"}>{academic.enrolledStatus}</Badge>
              ) : (
                "—"
              )}
            </InfoField>
            <InfoField label="Subjects">
              <span className="font-medium tabular-nums">
                {isIrregular
                  ? `${selectedSubjectIds.size} subject(s) · ${totalUnits} unit(s)`
                  : `${filteredSubjects.length} subject(s) · ${totalUnits} unit(s)`}
              </span>
            </InfoField>
            {(isIrregular ? selectedSubjects : filteredSubjects).length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/3">
                <ul className="flex flex-col gap-1.5">
                  {(isIrregular ? selectedSubjects : filteredSubjects).map((s) => (
                    <li
                      key={s.id}
                      className="flex justify-between gap-2 font-body text-xs text-slate-600 dark:text-slate-300"
                    >
                      <span className="truncate">
                        {s.code} — {s.title}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-400">{s.units}u</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="font-body text-sm text-slate-500 dark:text-slate-400">
                {isIrregular
                  ? "Select at least one subject."
                  : "No curriculum subjects found for this program, year, and semester."}
              </p>
            )}
          </dl>
        </EnrollmentSectionCard>
      </div>

      <ProgramWizardFooter
        backLabel="Back: Enrollment Information"
        onBack={onBack}
        primaryLabel="Submit Enrollment"
        onPrimary={onSave}
        primaryDisabled={!canSave}
        isSaving={isSaving}
      />
    </div>
  );
}
