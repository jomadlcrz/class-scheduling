import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { AddStudentWizard } from "~/features/enrollment/add-student-wizard";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { enumService, type EnumOptions } from "~/services/enum.service";
import { programService } from "~/services/program.service";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import { setService } from "~/services/set.service";
import { subjectService } from "~/services/subject.service";
import type { Program } from "~/types/program";
import type { Semester } from "~/types/semester";
import type { ClassSet } from "~/types/set";
import type { Subject } from "~/types/subject";

export function meta() {
  return [
    { title: "Add New Student — Enrollment — GWC Class Scheduling" },
    { name: "description", content: "Create a new student profile and enroll for the selected term." },
  ];
}

export default function EnrollmentNewStudentRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <EnrollmentNewStudentPage />
    </RoleGuard>
  );
}

function EnrollmentNewStudentPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [sets, setSets] = useState<ClassSet[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[] | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [enumOptions, setEnumOptions] = useState<EnumOptions | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    programService.list().then(setPrograms).catch(() => setPrograms([]));
    setService.list().then(setSets).catch(() => setSets([]));
    subjectService.list().then(setSubjects).catch(() => setSubjects([]));
    schoolYearService.list().then(setSchoolYears).catch(() => setSchoolYears([]));
    semesterService.list().then(setSemesters).catch(() => setSemesters([]));
    enumService.getOptions().then(setEnumOptions).catch(() => setEnumOptions(null));
  }, []);

  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  const isLoading = programs === null || schoolYears === null;
  const noAcademicTerm = schoolYears !== null && schoolYears.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Add New Student"
        description="Create a student profile and first-term enrollment — identity, academics, then review."
      />

      {noAcademicTerm ? (
        <div className="mt-6">
          <EmptyState
            title="No school years yet"
            action={
              <Button type="button" block={false} onClick={() => navigate("/academic-term")}>
                Create academic term
              </Button>
            }
          >
            Create the first academic term before enrolling students.
          </EmptyState>
        </div>
      ) : isLoading ? (
        <div
          role="status"
          aria-label="Loading enrollment form"
          className="mt-6 grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : (
        <div className="mt-6">
          <AddStudentWizard
            programs={programs}
            sets={sets}
            subjects={subjects}
            schoolYears={schoolYears}
            semesters={semesters}
            studentTypes={enumOptions?.studentType ?? []}
            academicStatuses={enumOptions?.academicStatus ?? []}
            isSaving={isSaving}
            onSavingChange={setIsSaving}
            onDirtyChange={setIsDirty}
            onCancel={() => navigate(-1)}
            onSaved={(message) => {
              if (message) toast.success(message);
              navigate(-1);
            }}
          />
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved changes?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have unsaved student details. Leaving this page will discard them.
      </ConfirmDialog>

      <ConfirmDialog
        open={reloadPromptOpen}
        onClose={() => setReloadPromptOpen(false)}
        title="Discard unsaved changes?"
        confirmLabel="Reload"
        loadingLabel="Reloading…"
        confirmVariant="danger"
        onConfirm={async () => confirmReload()}
      >
        You have unsaved student details. Reloading will discard them.
      </ConfirmDialog>
    </div>
  );
}
