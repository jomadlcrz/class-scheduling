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
import { irregularClassService, type IrregularStudent } from "~/services/irregular-class.service";

export function meta() {
  return [
    { title: "Irregular Students — Enrollment — GWC Class Scheduling" },
    { name: "description", content: "Students enrolled as Irregular for the selected term." },
  ];
}

export default function EnrollmentIrregularStudentsRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <EnrollmentIrregularStudentsPage />
    </RoleGuard>
  );
}

function toDirectoryRow(s: IrregularStudent): StudentDirectoryRow {
  return {
    studentProfileId: s.studentProfileId,
    studentId: s.studentId,
    name: s.studentName,
    email: s.email,
    mobile: s.mobile,
    profilePhotoUrl: s.profilePhotoUrl,
    program: s.programTaken === "—" ? "" : s.programTaken,
    yearLevel: s.yearLevel,
    set: s.set,
    studentType: s.studentType,
    enrollmentState: s.enrollmentState,
    accountStatus: s.accountStatus,
  };
}

function EnrollmentIrregularStudentsPage() {
  const navigate = useNavigate();
  const { context: termContext } = useTermContext();
  const syId = termContext?.selection.syId ?? null;
  const semesterNumber = termContext?.selection.semesterNumber ?? null;

  const { data: students, error: loadError } = useCachedData(
    `enrollment-irregular-students:${syId ?? "none"}:${semesterNumber ?? "none"}`,
    () => irregularClassService.listStudents(syId as number, semesterNumber as number),
    { enabled: syId != null && semesterNumber != null },
  );

  const rows = useMemo(() => (students ?? []).map(toDirectoryRow), [students]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Irregular Students"
        description="Students enrolled as Irregular for the selected term."
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
          <StudentDirectoryTable rows={rows} emptyMessage="No irregular student enrollments for this term yet." />
        )}
      </div>
    </div>
  );
}
