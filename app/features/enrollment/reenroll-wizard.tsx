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
  // Keyed by studentProfileId so toggling/select-all/removal are all O(1) and order-stable.
  const [selectedStudents, setSelectedStudents] = useState<Map<number, ReenrollDirectoryRow>>(new Map());
  const [academic, setAcademic] = useState<AcademicDraft>(EMPTY_ACADEMIC);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  const isIrregular = academic.enrolledStatus === "Irregular";
  const isDirty = selectedStudents.size > 0 || academic.programId !== "";

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    setSelectedSubjectIds(new Set());
  }, [academic.programId, academic.yearLevel, academic.semesterNumber, academic.enrolledStatus]);

  function handleAcademicChange(patch: Partial<AcademicDraft>) {
    setAcademic((current) => ({ ...current, ...patch }));
    if (patch.enrolledStatus === "Regular") {
      setSelectedSubjectIds(new Set());
    }
  }

  function toggleStudent(row: ReenrollDirectoryRow, checked: boolean) {
    setSelectedStudents((current) => {
      const next = new Map(current);
      if (checked) next.set(row.studentProfileId, row);
      else next.delete(row.studentProfileId);
      return next;
    });
  }

  function selectAllStudents(checked: boolean, rows: ReenrollDirectoryRow[]) {
    setSelectedStudents((current) => {
      const next = new Map(current);
      for (const row of rows) {
        if (checked) next.set(row.studentProfileId, row);
        else next.delete(row.studentProfileId);
      }
      return next;
    });
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
  const maxUnlockedIndex = selectedStudents.size > 0 ? (step2Valid ? 2 : 1) : 0;

  function goToStep(index: number) {
    if (index > maxUnlockedIndex) return;
    setSaveError(null);
    setCurrentIndex(index);
  }

  async function handleSave() {
    const rows = [...selectedStudents.values()];
    if (rows.length === 0) return;

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
    if (isIrregular && selectedSubjectIds.size === 0) {
      setSaveError("Select at least one subject.");
      return;
    }

    setSaveError(null);
    onSavingChange(true);

    const input = {
      programId: Number(academic.programId),
      yearLevel: Number(academic.yearLevel),
      setId: resolvedSetId,
      studentType: academic.studentType,
      enrolledStatus: academic.enrolledStatus,
      syId: Number(academic.syId),
      semesterNumber: Number(academic.semesterNumber),
      // Regular: server fills from curriculum — send empty list.
      subjectIds: isIrregular ? [...selectedSubjectIds] : [],
    };

    const results = await Promise.allSettled(
      rows.map((row) => studentService.enroll(row.studentProfileId, input).then((message) => ({ row, message }))),
    );

    const succeeded: { row: ReenrollDirectoryRow; message: string }[] = [];
    const failed: { row: ReenrollDirectoryRow; error: string }[] = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") succeeded.push(result.value);
      else failed.push({ row: rows[i], error: result.reason instanceof Error ? result.reason.message : "" });
    });

    onSavingChange(false);

    if (failed.length === 0) {
      onSaved(succeeded.length === 1 ? succeeded[0].message : `Enrolled ${succeeded.length} student(s).`);
      return;
    }

    // Partial (or total) failure: drop whoever already succeeded so a retry only targets what's left.
    setSelectedStudents((current) => {
      const next = new Map(current);
      for (const { row } of succeeded) next.delete(row.studentProfileId);
      return next;
    });
    const successNote = succeeded.length > 0 ? `${succeeded.length} succeeded. ` : "";
    setSaveError(
      `${successNote}${failed.length} failed: ` +
        failed.map(({ row, error }) => `${row.name} — ${error || "Unable to enroll."}`).join("; "),
    );
  }

  const selectedRows = [...selectedStudents.values()];

  return (
    <div className="flex flex-col gap-6">
      <Stepper steps={STEPS} currentIndex={currentIndex} maxUnlockedIndex={maxUnlockedIndex} onStepClick={goToStep} />

      <FormError message={saveError} />

      {currentIndex === 0 && (
        <ReenrollStep1SelectStudent
          directory={directory}
          selectedIds={new Set(selectedStudents.keys())}
          onToggleSelect={toggleStudent}
          onSelectAll={selectAllStudents}
          programs={programs}
          semesters={semesters}
          academicStatuses={academicStatuses}
          onNext={() => goToStep(1)}
          onCancel={onCancel}
        />
      )}

      {currentIndex === 1 && selectedStudents.size > 0 && (
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

      {currentIndex === 2 && selectedStudents.size > 0 && (
        <ReenrollStep3Review
          students={selectedRows}
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
              : subjects
                  .filter((s) => s.program === selectedProgram.abbrev && s.semester === semesterNumber)
                  .map((s) => s.id);
            toggleSelectAll(checked, ids);
          }}
          isSaving={isSaving}
          canSave={step2Valid && (!isIrregular || selectedSubjectIds.size > 0)}
          onBack={() => goToStep(1)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
