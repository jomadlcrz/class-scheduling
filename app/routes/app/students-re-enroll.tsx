import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { WizardSkeleton } from "~/components/ui/skeleton";
import type { ReenrollDirectoryRow } from "~/features/enrollment/reenroll-step1-select-student";
import { ReenrollWizard } from "~/features/enrollment/reenroll-wizard";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { enumService } from "~/services/enum.service";
import { irregularClassService } from "~/services/irregular-class.service";
import { programService } from "~/services/program.service";
import { regularClassService } from "~/services/regular-class.service";
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

  const [directory, setDirectory] = useState<ReenrollDirectoryRow[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Build a searchable directory across every term — a returning student to re-enroll
  // is, by definition, likely absent from the currently selected term's own lists.
  useEffect(() => {
    if (schoolYears === null || semesters.length === 0) return;
    let cancelled = false;
    const orderedSchoolYears = [...schoolYears].sort((a, b) => a.schoolYear.localeCompare(b.schoolYear));
    const orderedSemesters = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);
    Promise.all(
      orderedSchoolYears.flatMap((sy) =>
        orderedSemesters.map((sem) =>
          Promise.all([
            regularClassService.listStudents(sy.id, sem.semesterNumber).catch(() => []),
            irregularClassService.listStudents(sy.id, sem.semesterNumber).catch(() => []),
          ]).then(([regular, irregular]) => ({ semesterNumber: sem.semesterNumber, regular, irregular })),
        ),
      ),
    ).then((termResults) => {
      if (cancelled) return;
      const byId = new Map<number, ReenrollDirectoryRow>();
      for (const { semesterNumber, regular, irregular } of termResults) {
        for (const s of regular) {
          const academic = s.academics[0];
          byId.set(s.studentProfileId, {
            studentProfileId: s.studentProfileId,
            studentId: s.studentId,
            name: s.studentName,
            program: academic?.program ?? "",
            yearLevel: academic?.yearLevel ?? 0,
            semesterNumber,
            enrolledStatus: academic?.enrolledStatus ?? "",
            accountStatus: s.accountStatus,
          });
        }
        for (const s of irregular) {
          byId.set(s.studentProfileId, {
            studentProfileId: s.studentProfileId,
            studentId: s.studentId,
            name: s.studentName,
            program: s.programTaken,
            yearLevel: s.yearLevel,
            semesterNumber,
            enrolledStatus: s.enrolledStatus,
            accountStatus: s.accountStatus,
          });
        }
      }
      setDirectory([...byId.values()].sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => {
      cancelled = true;
    };
  }, [schoolYears, semesters]);

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
            directory={directory}
            programs={programs}
            sets={sets}
            subjects={subjects}
            schoolYears={schoolYears}
            semesters={semesters}
            studentTypes={enumOptions?.studentType ?? []}
            academicStatuses={enumOptions?.academicStatus ?? []}
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
