import { useEffect, useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Stepper, type StepDefinition } from "~/components/ui/stepper";
import { AddStudentStep1Identity, type IdentityDraft } from "~/features/enrollment/add-student-step1-identity";
import { AddStudentStep2Academic, type AcademicDraft } from "~/features/enrollment/add-student-step2-academic";
import { AddStudentStep3Review } from "~/features/enrollment/add-student-step3-review";
import { studentSchema } from "~/schemas/student.schema";
import { studentService } from "~/services/student.service";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";

const STEPS: StepDefinition[] = [
  { key: "identity", label: "Identity Information" },
  { key: "academic", label: "Academic Information" },
  { key: "review", label: "Subjects & Review" },
];

const EMPTY_IDENTITY: IdentityDraft = {
  studentId: "",
  firstName: "",
  midName: "",
  lastName: "",
  suffix: "",
  mobile: "",
  email: "",
};

const EMPTY_ACADEMIC: AcademicDraft = {
  programId: "",
  yearLevel: "",
  enrolledStatus: "Regular",
  studentType: "",
  setId: "",
  syId: "",
  semesterNumber: "",
};

type AddStudentWizardProps = {
  programs: Program[];
  sets: ClassSet[];
  subjects: Subject[];
  schoolYears: SchoolYearOption[];
  semesters: Semester[];
  studentTypes: string[];
  academicStatuses: string[];
  nameSuffixes: string[];
  isSaving: boolean;
  onSavingChange: (saving: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
  onSaved: (message: string) => void;
};

export function AddStudentWizard({
  programs,
  sets,
  subjects,
  schoolYears,
  semesters,
  studentTypes,
  academicStatuses,
  nameSuffixes,
  isSaving,
  onSavingChange,
  onDirtyChange,
  onCancel,
  onSaved,
}: AddStudentWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [identity, setIdentity] = useState<IdentityDraft>(EMPTY_IDENTITY);
  const [academic, setAcademic] = useState<AcademicDraft>(EMPTY_ACADEMIC);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  const isIrregular = academic.enrolledStatus === "Irregular";

  const isDirty =
    identity.firstName.trim() !== "" ||
    identity.lastName.trim() !== "" ||
    identity.mobile.trim() !== "" ||
    identity.email.trim() !== "" ||
    academic.programId !== "" ||
    photoFile !== null;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  // Subject choices depend on program/year/semester/status — drop stale selections when those change.
  useEffect(() => {
    setSelectedSubjectIds(new Set());
  }, [academic.programId, academic.yearLevel, academic.semesterNumber, academic.enrolledStatus]);

  function handleIdentityChange(patch: Partial<IdentityDraft>) {
    setIdentity((current) => ({ ...current, ...patch }));
  }

  function handleAcademicChange(patch: Partial<AcademicDraft>) {
    setAcademic((current) => ({ ...current, ...patch }));
    if (patch.enrolledStatus === "Regular") {
      setSelectedSubjectIds(new Set());
    }
  }

  function toggleSubject(subjectId: number, checked: boolean) {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(subjectId);
      else next.delete(subjectId);
      return next;
    });
  }

  const step1Valid =
    identity.firstName.trim() !== "" && identity.lastName.trim() !== "" && identity.mobile.trim() !== "" && identity.email.trim() !== "";
  const step2Valid =
    academic.programId !== "" &&
    academic.yearLevel !== "" &&
    academic.enrolledStatus !== "" &&
    academic.studentType !== "" &&
    academic.syId !== "" &&
    academic.semesterNumber !== "" &&
    (isIrregular || academic.setId !== "");
  const step3Valid = !isIrregular || selectedSubjectIds.size > 0;
  const maxUnlockedIndex = step1Valid ? (step2Valid ? 2 : 1) : 0;

  function goToStep(index: number) {
    if (index > maxUnlockedIndex) return;
    setSaveError(null);
    setCurrentIndex(index);
  }

  async function handleSave() {
    // Irregular students don't belong to a standard set, but the backend still requires a
    // set_id — fall back to any set matching their program/year level (same rule as
    // StudentRecordForm, which this wizard replaces the UI of, not the underlying contract).
    const selectedProgram = programs.find((p) => String(p.id) === academic.programId);
    const irregularFallbackSet = sets.find(
      (s) => s.program === selectedProgram?.abbrev && (!academic.yearLevel || String(s.yearLevel) === academic.yearLevel),
    );
    const setId = isIrregular ? String(irregularFallbackSet?.id ?? "") : academic.setId;

    const result = studentSchema.safeParse({
      studentId: identity.studentId.trim(),
      firstName: identity.firstName.trim(),
      midName: identity.midName.trim(),
      lastName: identity.lastName.trim(),
      suffix: identity.suffix.trim(),
      mobile: identity.mobile.trim(),
      email: identity.email.trim(),
      programId: academic.programId,
      yearLevel: academic.yearLevel,
      setId,
      studentType: academic.studentType,
      enrolledStatus: academic.enrolledStatus,
      syId: academic.syId,
      semesterNumber: academic.semesterNumber,
      // Regular: server fills from curriculum — send empty list.
      subjectIds: isIrregular ? Array.from(selectedSubjectIds) : [],
    });
    if (!result.success) {
      setSaveError(result.error.issues[0].message);
      return;
    }

    setSaveError(null);
    onSavingChange(true);
    try {
      const created = await studentService.createRecord({
        ...result.data,
        studentId: result.data.studentId || undefined,
        midName: result.data.midName || undefined,
        suffix: result.data.suffix || undefined,
      });

      if (photoFile) {
        try {
          await studentService.uploadProfilePhoto(created.studentProfileId, photoFile);
        } catch (photoErr) {
          // Profile was created — surface photo failure without blocking success navigation.
          onSaved(
            `${created.message} Photo upload failed: ${
              photoErr instanceof Error ? photoErr.message : "unknown error"
            }`,
          );
          return;
        }
      }

      onSaved(created.message);
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
        <AddStudentStep1Identity
          identity={identity}
          onIdentityChange={handleIdentityChange}
          nameSuffixes={nameSuffixes}
          photoFile={photoFile}
          onPhotoChange={setPhotoFile}
          canAdvance={step1Valid}
          onNext={() => goToStep(1)}
          onCancel={onCancel}
        />
      )}

      {currentIndex === 1 && (
        <AddStudentStep2Academic
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

      {currentIndex === 2 && (
        <AddStudentStep3Review
          identity={identity}
          academic={academic}
          programs={programs}
          sets={sets}
          schoolYears={schoolYears}
          semesters={semesters}
          subjects={subjects}
          photoUrl={photoPreviewUrl}
          selectedSubjectIds={selectedSubjectIds}
          onToggleSubject={toggleSubject}
          isSaving={isSaving}
          canSave={step1Valid && step2Valid && (!isIrregular || selectedSubjectIds.size > 0)}
          onBack={() => goToStep(1)}
          onSave={handleSave}
          onEditIdentity={() => goToStep(0)}
          onEditAcademic={() => goToStep(1)}
        />
      )}
    </div>
  );
}
