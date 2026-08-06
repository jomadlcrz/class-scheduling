import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import type { AcademicDraft } from "~/features/enrollment/add-student-step2-academic";
import type { IdentityDraft } from "~/features/enrollment/add-student-step1-identity";
import { ProgramWizardFooter } from "~/features/subjects/program-wizard-footer";
import type { Program } from "~/types/program";
import type { Subject } from "~/types/subject";

type AddStudentStep3ReviewProps = {
  identity: IdentityDraft;
  academic: AcademicDraft;
  programs: Program[];
  subjects: Subject[];
  selectedSubjectIds: Set<number>;
  onToggleSubject: (subjectId: number, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  isSaving: boolean;
  canSave: boolean;
  onBack: () => void;
  onSave: () => void;
};

export function AddStudentStep3Review({
  identity,
  academic,
  programs,
  subjects,
  selectedSubjectIds,
  onToggleSubject,
  onToggleSelectAll,
  isSaving,
  canSave,
  onBack,
  onSave,
}: AddStudentStep3ReviewProps) {
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

  const allSelected = filteredSubjects.length > 0 && filteredSubjects.every((s) => selectedSubjectIds.has(s.id));
  const totalUnits = filteredSubjects
    .filter((s) => selectedSubjectIds.has(s.id))
    .reduce((sum, s) => sum + s.units, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-slate-600 dark:text-slate-300">Select Subjects</span>
          {filteredSubjects.length > 0 && (
            <Checkbox
              id="new-student-subjects-select-all"
              label="Select All"
              checked={allSelected}
              onChange={onToggleSelectAll}
            />
          )}
        </div>
        <div className="mt-1 flex max-h-56 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-white/10">
          {filteredSubjects.length === 0 ? (
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">
              No curriculum subjects found for this program, year, and semester.
            </p>
          ) : (
            filteredSubjects.map((s) => (
              <Checkbox
                key={s.id}
                id={`new-student-subject-${s.id}`}
                label={`${s.code} — ${s.title} (${s.units} units)`}
                checked={selectedSubjectIds.has(s.id)}
                onChange={(checked) => onToggleSubject(s.id, checked)}
              />
            ))
          )}
        </div>
      </div>

      <Card className="p-4">
        <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Enrollment Summary</h3>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-body text-xs text-slate-400 dark:text-slate-500">Student</dt>
            <dd className="font-body text-slate-700 dark:text-slate-200">
              {identity.lastName}, {identity.firstName} {identity.midName}
            </dd>
          </div>
          <div>
            <dt className="font-body text-xs text-slate-400 dark:text-slate-500">Program</dt>
            <dd className="font-body text-slate-700 dark:text-slate-200">
              {selectedProgram ? `${selectedProgram.abbrev} — ${selectedProgram.name}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-body text-xs text-slate-400 dark:text-slate-500">Enrolled Status</dt>
            <dd className="font-body text-slate-700 dark:text-slate-200">{academic.enrolledStatus || "—"}</dd>
          </div>
          <div>
            <dt className="font-body text-xs text-slate-400 dark:text-slate-500">Selected Subjects</dt>
            <dd className="font-body text-slate-700 dark:text-slate-200">
              {selectedSubjectIds.size} subject(s) · {totalUnits} unit(s)
            </dd>
          </div>
        </dl>
      </Card>

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
