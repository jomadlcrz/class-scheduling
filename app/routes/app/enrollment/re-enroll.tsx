import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/modal";
import { WizardSkeleton } from "~/components/ui/skeleton";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { ReenrollWizard } from "~/features/enrollment/reenroll-wizard";
import type { ReenrollDirectoryFilterState } from "~/features/enrollment/reenroll-step1-select-student";
import { useCachedData } from "~/hooks/use-cached-data";
import { useDebounce } from "~/hooks/use-debounce";
import { useUnsavedChangesGuard } from "~/hooks/use-unsaved-changes-guard";
import { PageHeader } from "~/layouts/page-header";
import { enrollmentService } from "~/services/enrollment.service";
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
    { title: "Re-enroll Existing Student — Enrollment — GWC Class Scheduling" },
    { name: "description", content: "Enroll a returning student profile into a new term." },
  ];
}

export default function EnrollmentReenrollRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <EnrollmentReenrollPage />
    </RoleGuard>
  );
}

function EnrollmentReenrollPage() {
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { data: programs } = useCachedData("programs", () => programService.list());
  const { data: setsData } = useCachedData("sets", () => setService.list(), { enabled: isDirty });
  const sets = setsData ?? [];
  const { data: subjectsData } = useCachedData("subjects", () => subjectService.list(), { enabled: isDirty });
  const subjects = subjectsData ?? [];
  const { data: schoolYears } = useCachedData("school-years", () => schoolYearService.list());
  const { data: semestersData } = useCachedData("semesters", () => semesterService.list());
  const semesters = semestersData ?? [];
  const { data: enumOptions } = useCachedData("enums", () => enumService.getOptions());
  const [directoryFilters, setDirectoryFilters] = useState<ReenrollDirectoryFilterState>({
    search: "",
    program: "all",
    yearLevel: "all",
    semester: "all",
    enrolledStatus: "all",
  });
  const debouncedDirectorySearch = useDebounce(directoryFilters.search, 300);
  const directoryRequestFilters = { ...directoryFilters, search: debouncedDirectorySearch };
  const directoryFilterKey = [
    debouncedDirectorySearch.trim(),
    directoryFilters.program,
    directoryFilters.yearLevel,
    directoryFilters.semester,
    directoryFilters.enrolledStatus,
  ].join("|");

  // Returning-students directory in one backend call. Eligibility (already enrolled / blocked)
  // is computed against the app's currently-selected term — the default target for re-enrollment.
  const { context: termContext } = useTermContext();
  const targetSyId = termContext?.selection.syId ?? null;
  const targetSem = termContext?.selection.semesterNumber ?? null;
  const { data: directory } = useCachedData(
    `reenroll-directory:${targetSyId ?? "none"}:${targetSem ?? "none"}:${directoryFilterKey}`,
    () => enrollmentService.getReenrollDirectory(targetSyId, targetSem, directoryRequestFilters),
    { cache: false },
  );

  const { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload } =
    useUnsavedChangesGuard(isDirty, !isSaving);

  const isLoading = programs === null || schoolYears === null;
  const noAcademicTerm = schoolYears !== null && schoolYears.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Re-enroll Existing Student"

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
        <div className="mt-6">
          <WizardSkeleton />
        </div>
      ) : (
        <div className="mt-6">
          <ReenrollWizard
            directory={directory}
            programs={programs}
            sets={sets}
            subjects={subjects}
            schoolYears={schoolYears}
            semesters={semesters}
            studentTypes={enumOptions?.studentType ?? []}
            academicStatuses={enumOptions?.academicStatus ?? []}
            directoryFilters={directoryFilters}
            onDirectoryFiltersChange={(patch) => {
              setDirectoryFilters((current) => ({ ...current, ...patch }));
            }}
            isSaving={isSaving}
            onSavingChange={setIsSaving}
            onDirtyChange={setIsDirty}
            onCancel={() => navigate("/enrollment/regular-students")}
            onSaved={(message) => {
              if (message) toast.success(message);
              navigate("/enrollment/regular-students");
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
        You have unsaved enrollment details. Leaving this page will discard them.
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
        You have unsaved enrollment details. Reloading will discard them.
      </ConfirmDialog>
    </div>
  );
}
