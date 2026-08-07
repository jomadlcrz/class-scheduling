import { Badge } from "~/components/ui/badge";
import { BookmarkIcon } from "~/components/ui/icons";
import { Checkbox } from "~/components/ui/checkbox";
import type { AcademicDraft } from "~/features/enrollment/add-student-step2-academic";
import type { IdentityDraft } from "~/features/enrollment/add-student-step1-identity";
import {
  EnrollmentSectionCard,
  InfoField,
} from "~/features/enrollment/enrollment-section-card";
import { StudentInfoSummaryCard } from "~/features/enrollment/student-info-summary-card";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import { useYearLevels } from "~/hooks/use-year-levels";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";

type AddStudentStep3ReviewProps = {
  identity: IdentityDraft;
  academic: AcademicDraft;
  programs: Program[];
  sets: ClassSet[];
  schoolYears: SchoolYearOption[];
  semesters: Semester[];
  subjects: Subject[];
  photoUrl?: string | null;
  selectedSubjectIds: Set<number>;
  onToggleSubject: (subjectId: number, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  isSaving: boolean;
  canSave: boolean;
  onBack: () => void;
  onSave: () => void;
  onEditIdentity: () => void;
  onEditAcademic: () => void;
};

export function AddStudentStep3Review({
  identity,
  academic,
  programs,
  sets,
  schoolYears,
  semesters,
  subjects,
  photoUrl,
  selectedSubjectIds,
  onToggleSubject,
  onToggleSelectAll,
  isSaving,
  canSave,
  onBack,
  onSave,
  onEditIdentity,
  onEditAcademic,
}: AddStudentStep3ReviewProps) {
  const { yearLevelLabel } = useYearLevels();
  const selectedProgram = programs.find((p) => String(p.id) === academic.programId);
  const selectedSet = sets.find((s) => String(s.id) === academic.setId);
  const selectedSy = schoolYears.find((sy) => String(sy.id) === academic.syId);
  const selectedSem = semesters.find((s) => String(s.semesterNumber) === academic.semesterNumber);
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

  const allSelected =
    filteredSubjects.length > 0 && filteredSubjects.every((s) => selectedSubjectIds.has(s.id));
  const selectedSubjects = filteredSubjects.filter((s) => selectedSubjectIds.has(s.id));
  const totalUnits = selectedSubjects.reduce((sum, s) => sum + s.units, 0);

  const programLabel = selectedProgram
    ? `${selectedProgram.abbrev} — ${selectedProgram.name}`
    : "";

  return (
    <div className="flex flex-col gap-5">
      <StudentInfoSummaryCard
        identity={identity}
        academic={academic}
        programLabel={programLabel}
        yearLevelLabel={academic.yearLevel ? yearLevelLabel(Number(academic.yearLevel)) : ""}
        setLabel={selectedSet?.setCode}
        schoolYearLabel={selectedSy?.schoolYear ?? ""}
        semesterLabel={selectedSem?.semester ?? ""}
        photoUrl={photoUrl}
        onEditIdentity={onEditIdentity}
        onEditAcademic={onEditAcademic}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <EnrollmentSectionCard
          title={isIrregular ? "Subjects for this term" : "Curriculum subjects"}
          icon={<BookmarkIcon />}
          action={
            filteredSubjects.length > 0 ? (
              <Checkbox
                id="new-student-subjects-select-all"
                label="Select All"
                checked={allSelected}
                onChange={onToggleSelectAll}
              />
            ) : undefined
          }
        >
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {filteredSubjects.length === 0 ? (
              <p className="font-body text-sm text-slate-500 dark:text-slate-400">
                No curriculum subjects found for this program, year, and semester.
              </p>
            ) : (
              filteredSubjects.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:hover:border-white/10 dark:hover:bg-white/[0.03]"
                >
                  <Checkbox
                    id={`new-student-subject-${s.id}`}
                    hideLabel
                    ariaLabel={`${s.code} — ${s.title}`}
                    checked={selectedSubjectIds.has(s.id)}
                    onChange={(checked) => onToggleSubject(s.id, checked)}
                  />
                  <label
                    htmlFor={`new-student-subject-${s.id}`}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="block font-body text-sm font-medium text-navy-800 dark:text-mist-100">
                      {s.code}
                    </span>
                    <span className="block font-body text-xs text-slate-500 dark:text-slate-400">
                      {s.title} · {s.units} units
                    </span>
                  </label>
                </div>
              ))
            )}
          </div>
        </EnrollmentSectionCard>

        <EnrollmentSectionCard title="Enrollment Summary">
          <dl className="grid gap-4">
            <InfoField label="Student">
              {[identity.lastName, [identity.firstName, identity.midName].filter(Boolean).join(" ")]
                .filter(Boolean)
                .join(", ") || "—"}
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
            {!isIrregular ? (
              <InfoField label="Class Set">{selectedSet?.setCode || "—"}</InfoField>
            ) : null}
            <InfoField label="Term">
              {[selectedSy?.schoolYear, selectedSem?.semester].filter(Boolean).join(" · ") || "—"}
            </InfoField>
            <InfoField label="Selected Subjects">
              <span className="font-medium tabular-nums">
                {selectedSubjectIds.size} subject(s) · {totalUnits} unit(s)
              </span>
            </InfoField>
            {selectedSubjects.length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <ul className="flex flex-col gap-1.5">
                  {selectedSubjects.map((s) => (
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
            ) : null}
          </dl>
        </EnrollmentSectionCard>
      </div>

      <ProgramWizardFooter
        backLabel="Back: Academic Information"
        onBack={onBack}
        primaryLabel="Add Student"
        onPrimary={onSave}
        primaryDisabled={!canSave}
        isSaving={isSaving}
      />
    </div>
  );
}
