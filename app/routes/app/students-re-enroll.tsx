import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { WizardSkeleton } from "~/components/ui/skeleton";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { ReenrollWizard } from "~/features/enrollment/reenroll-wizard";
import type { ReenrollDirectoryFilterState } from "~/features/enrollment/reenroll-step1-select-student";
import { useCachedData } from "~/hooks/use-cached-data";
import { useDebounce } from "~/hooks/use-debounce";
import { PageHeader } from "~/layouts/page-header";
import { enrollmentService } from "~/services/enrollment.service";
import { enumService } from "~/services/enum.service";
import { programService } from "~/services/program.service";
import { schoolYearService } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import { setService } from "~/services/set.service";
import { subjectService } from "~/services/subject.service";

export function meta() {
  return [
    { title: "Re-enroll Students — GWC Class Scheduling" },
    { name: "description", content: "Enroll one or more existing student profiles into a new term." },
  ];
}

export default function StudentsReenrollRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <StudentsReenrollPage />
    </RoleGuard>
  );
}

function StudentsReenrollPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");

  const { data: programs } = useCachedData("programs", () => programService.list());
  const { data: setsData } = useCachedData("sets", () => setService.list());
  const sets = setsData ?? [];
  const { data: subjectsData } = useCachedData("subjects", () => subjectService.list());
  const subjects = subjectsData ?? [];
  const { data: schoolYears } = useCachedData("school-years", () => schoolYearService.list());
  const { data: semestersData } = useCachedData("semesters", () => semesterService.list());
  const semesters = semestersData ?? [];
  const { data: enumOptions } = useCachedData("enums", () => enumService.getOptions());

  const [isSaving, setIsSaving] = useState(false);
  const [directoryFilters, setDirectoryFilters] = useState<ReenrollDirectoryFilterState>({
    search: "",
    program: "all",
    yearLevel: "all",
    semester: "all",
    enrolledStatus: "all",
  });
  const [directoryPage, setDirectoryPage] = useState(1);
  const directoryPageSize = 10;
  const debouncedDirectorySearch = useDebounce(directoryFilters.search, 300);
  const directoryRequestFilters = { ...directoryFilters, search: debouncedDirectorySearch };
  const directoryFilterKey = [
    debouncedDirectorySearch.trim(),
    directoryFilters.program,
    directoryFilters.yearLevel,
    directoryFilters.semester,
    directoryFilters.enrolledStatus,
  ].join("|");

  // Returning-students directory in one backend call, with re-enroll eligibility computed
  // against the app's currently-selected term.
  const { context: termContext } = useTermContext();
  const targetSyId = termContext?.selection.syId ?? null;
  const targetSem = termContext?.selection.semesterNumber ?? null;
  const { data: directory } = useCachedData(
    `reenroll-directory:${targetSyId ?? "none"}:${targetSem ?? "none"}:${directoryFilterKey}:p${directoryPage}`,
    () =>
      enrollmentService.getReenrollDirectory(
        targetSyId,
        targetSem,
        directoryRequestFilters,
        directoryPage,
        directoryPageSize,
      ),
    { cache: false },
  );

  const initialSelectedIds = studentIdParam ? [Number(studentIdParam)] : undefined;
  const isLoading = programs === null || schoolYears === null;
  const noAcademicTerm = schoolYears !== null && schoolYears.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Re-enroll Students"
        actions={
          <Button type="button" variant="outline" block={false} onClick={() => navigate("/students")}>
            Back to Students
          </Button>
        }
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
            directory={directory?.items ?? null}
            directoryTotal={directory?.total ?? 0}
            directoryPage={directoryPage}
            directoryPageSize={directoryPageSize}
            onDirectoryPageChange={setDirectoryPage}
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
              setDirectoryPage(1);
            }}
            isSaving={isSaving}
            onSavingChange={setIsSaving}
            onDirtyChange={() => {}}
            onCancel={() => navigate("/students")}
            onSaved={(message) => {
              if (message) toast.success(message);
              navigate("/students");
            }}
            initialSelectedIds={initialSelectedIds}
          />
        </div>
      )}
    </div>
  );
}
