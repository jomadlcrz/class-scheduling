import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";
import { TableSkeleton } from "~/components/ui/skeleton";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { EnrollmentRecordsView } from "~/features/enrollment/records/enrollment-records-view";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { enrollmentService } from "~/services/enrollment.service";

export function meta() {
  return [
    { title: "Enrollment Records — GWC Class Scheduling" },
    {
      name: "description",
      content: "Every enrolled student for the term — regular and irregular — in one directory.",
    },
  ];
}

export default function EnrollmentStudentsRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <EnrollmentStudentsPage />
    </RoleGuard>
  );
}

function EnrollmentStudentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") ?? "all";

  const { context: termContext } = useTermContext();
  const syId = termContext?.selection.syId ?? null;
  const semesterNumber = termContext?.selection.semesterNumber ?? null;
  const enabled = syId != null && semesterNumber != null;
  const termKey = enabled ? `${syId}:${semesterNumber}` : "none";

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: enrollmentData, error: loadError, reload: reloadStudents } = useCachedData(
    `enrollment-records:${termKey}:p${page}`,
    () => enrollmentService.listTermEnrollments(syId as number, semesterNumber as number, page, pageSize),
    { enabled },
  );
  const students = enrollmentData?.items ?? null;
  const totalItems = enrollmentData?.total ?? 0;
  const { data: facets, reload: reloadFacets } = useCachedData(
    `enrollment-facets:${termKey}`,
    () => enrollmentService.getFacets(syId as number, semesterNumber as number),
    { enabled },
  );

  async function refetch() {
    await Promise.all([reloadStudents(), reloadFacets()]);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Enrollment Records"
        actions={
          <Button type="button" block={false} onClick={() => navigate("/enrollment/new")}>
            <PlusIcon />
            Add New Student
          </Button>
        }
      />

      <div className="mt-6">
        {loadError && students === null ? (
          <EmptyState title="Unable to load enrollments">{loadError}</EmptyState>
        ) : students === null ? (
          <TableSkeleton columns={9} rows={8} />
        ) : (
          <EnrollmentRecordsView
            students={students}
            facets={facets ?? null}
            onChanged={refetch}
            initialType={initialType}
            page={page}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
