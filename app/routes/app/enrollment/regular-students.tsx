import { useMemo } from "react";
import { useNavigate } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";
import { EmptyState } from "~/components/feedback/empty-state";
import { TableSkeleton } from "~/components/ui/skeleton";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { StudentDirectoryTable, type StudentDirectoryRow } from "~/features/enrollment/student-directory-table";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { regularClassService } from "~/services/regular-class.service";
import type { RegularStudentRow } from "~/types/student";

export function meta() {
  return [
    { title: "Regular Students — Enrollment — GWC Class Scheduling" },
    { name: "description", content: "Students enrolled as Regular for the selected term." },
  ];
}

export default function EnrollmentRegularStudentsRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <EnrollmentRegularStudentsPage />
    </RoleGuard>
  );
}

function toDirectoryRow(s: RegularStudentRow): StudentDirectoryRow {
  const academic = s.academics[0];
  return {
    studentProfileId: s.studentProfileId,
    studentId: s.studentId,
    name: s.studentName,
    email: s.email,
    mobile: s.mobile,
    program: academic?.program ?? "",
    yearLevel: academic?.yearLevel ?? 0,
    set: academic?.set ?? null,
    studentType: academic?.studentType ?? "",
    enrollmentState: academic?.enrollmentState ?? "",
    accountStatus: s.accountStatus,
  };
}

function EnrollmentRegularStudentsPage() {
  const navigate = useNavigate();
  const { context: termContext } = useTermContext();
  const syId = termContext?.selection.syId ?? null;
  const semesterNumber = termContext?.selection.semesterNumber ?? null;

  const { data: students, error: loadError } = useCachedData(
    `enrollment-regular-students:${syId ?? "none"}:${semesterNumber ?? "none"}`,
    () => regularClassService.listStudents(syId as number, semesterNumber as number),
    { enabled: syId != null && semesterNumber != null },
  );

  const rows = useMemo(() => (students ?? []).map(toDirectoryRow), [students]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Regular Students"
        description="Students enrolled as Regular for the selected term."
        actions={
          <Button type="button" block={false} onClick={() => navigate("/enrollment/new")}>
            <PlusIcon />
            Add New Student
          </Button>
        }
      />

      <div className="mt-6">
        {loadError && students === null ? (
          <EmptyState title="Unable to load students">{loadError}</EmptyState>
        ) : students === null ? (
          <TableSkeleton columns={9} rows={8} />
        ) : (
          <StudentDirectoryTable rows={rows} emptyMessage="No regular student enrollments for this term yet." />
        )}
      </div>
    </div>
  );
}
