import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Stepper, type StepDefinition } from "~/components/ui/stepper";
import type { AcademicDraft } from "~/features/enrollment/add-student-step2-academic";
import { ReenrollStep1SelectStudent, type ReenrollDirectoryRow } from "~/features/enrollment/reenroll-step1-select-student";
import { ReenrollStep2Enrollment } from "~/features/enrollment/reenroll-step2-enrollment";
import { ReenrollStep3Review } from "~/features/enrollment/reenroll-step3-review";
import { studentService } from "~/services/student.service";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";

const STEPS: StepDefinition[] = [
  { key: "student", label: "Select Student" },
  { key: "enrollment", label: "Enrollment Information" },
  { key: "review", label: "Review & Confirm" },
];

const EMPTY_ACADEMIC: AcademicDraft = {
  programId: "",
  yearLevel: "",
  enrolledStatus: "",
  studentType: "",
  setId: "",
  syId: "",
  semesterNumber: "",
};

type ReenrollWizardProps = {
  directory: ReenrollDirectoryRow[] | null;
  programs: Program[];
  sets: ClassSet[];
  subjects: Subject[];
  schoolYears: SchoolYearOption[];
  semesters: Semester[];
  studentTypes: string[];
  academicStatuses: string[];
  isSaving: boolean;
  onSavingChange: (saving: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
  onSaved: (message: string) => void;
};

export function ReenrollWizard({
  directory,
  programs,
  sets,
  subjects,
  schoolYears,
  semesters,
  studentTypes,
  academicStatuses,
  isSaving,
  onSavingChange,
  onDirtyChange,
  onCancel,
  onSaved,
}: ReenrollWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<ReenrollDirectoryRow | null>(null);
  const [academic, setAcademic] = useState<AcademicDraft>(EMPTY_ACADEMIC);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  const isIrregular = academic.enrolledStatus === "Irregular";
  const isDirty = selectedStudent !== null || academic.programId !== "";

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    setSelectedSubjectIds(new Set());
  }, [academic.programId, academic.yearLevel, academic.semesterNumber, academic.enrolledStatus]);

  function handleAcademicChange(patch: Partial<AcademicDraft>) {
    setAcademic((current) => ({ ...current, ...patch }));
  }

  function toggleSubject(subjectId: number, checked: boolean) {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(subjectId);
      else next.delete(subjectId);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean, subjectIds: number[]) {
    setSelectedSubjectIds(checked ? new Set(subjectIds) : new Set());
  }

  const step2Valid =
    academic.programId !== "" &&
    academic.yearLevel !== "" &&
    academic.enrolledStatus !== "" &&
    academic.studentType !== "" &&
    academic.syId !== "" &&
    academic.semesterNumber !== "" &&
    (isIrregular || academic.setId !== "");
  const maxUnlockedIndex = selectedStudent ? (step2Valid ? 2 : 1) : 0;

  function goToStep(index: number) {
    if (index > maxUnlockedIndex) return;
    setSaveError(null);
    setCurrentIndex(index);
  }

  async function handleSave() {
    if (!selectedStudent) return;

    // Irregular students don't belong to a standard set, but the backend still requires a
    // set_id — fall back to any set matching their program/year level (same rule as
    // StudentEnrollForm, which this wizard replaces the UI of, not the underlying contract).
    const selectedProgram = programs.find((p) => String(p.id) === academic.programId);
    const irregularFallbackSet = sets.find(
      (s) => s.program === selectedProgram?.abbrev && (!academic.yearLevel || String(s.yearLevel) === academic.yearLevel),
    );
    const resolvedSetId = isIrregular ? irregularFallbackSet?.id : Number(academic.setId);

    if (!resolvedSetId) {
      setSaveError("Select a set.");
      return;
    }
    if (selectedSubjectIds.size === 0) {
      setSaveError("Select at least one subject.");
      return;
    }

    setSaveError(null);
    onSavingChange(true);
    try {
      const message = await studentService.enroll(selectedStudent.studentProfileId, {
        programId: Number(academic.programId),
        yearLevel: Number(academic.yearLevel),
        setId: resolvedSetId,
        studentType: academic.studentType,
        enrolledStatus: academic.enrolledStatus,
        syId: Number(academic.syId),
        semesterNumber: Number(academic.semesterNumber),
        subjectIds: [...selectedSubjectIds],
      });
      onSaved(message);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "");
      onSavingChange(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Stepper steps={STEPS} currentIndex={currentIndex} maxUnlockedIndex={maxUnlockedIndex} onStepClick={goToStep} />

      <FormError message={saveError} />

      {currentIndex === 0 && (
        <ReenrollStep1SelectStudent
          directory={directory}
          selected={selectedStudent}
          onSelect={setSelectedStudent}
          onNext={() => goToStep(1)}
          onCancel={onCancel}
        />
      )}

      {currentIndex === 1 && selectedStudent && (
        <ReenrollStep2Enrollment
          academic={academic}
          onAcademicChange={handleAcademicChange}
          programs={programs}
          sets={sets}
          schoolYears={schoolYears}
          semesters={semesters}
          studentTypes={studentTypes}
          academicStatuses={academicStatuses}
          canAdvance={step2Valid}
          onNext={() => goToStep(2)}
          onBack={() => goToStep(0)}
        />
      )}

      {currentIndex === 2 && selectedStudent && (
        <ReenrollStep3Review
          student={selectedStudent}
          academic={academic}
          programs={programs}
          subjects={subjects}
          selectedSubjectIds={selectedSubjectIds}
          onToggleSubject={toggleSubject}
          onToggleSelectAll={(checked) => {
            const selectedProgram = programs.find((p) => String(p.id) === academic.programId);
            const semesterNumber = Number(academic.semesterNumber);
            const ids = !selectedProgram
              ? []
              : (isIrregular
                  ? subjects.filter((s) => s.program === selectedProgram.abbrev && s.semester === semesterNumber)
                  : subjects.filter(
                      (s) =>
                        s.program === selectedProgram.abbrev &&
                        String(s.yearLevel) === academic.yearLevel &&
                        s.semester === semesterNumber,
                    )
                ).map((s) => s.id);
            toggleSelectAll(checked, ids);
          }}
          isSaving={isSaving}
          canSave={step2Valid}
          onBack={() => goToStep(1)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
