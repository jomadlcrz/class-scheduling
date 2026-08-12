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
import { useDebounce } from "~/hooks/use-debounce";
import { PageHeader } from "~/layouts/page-header";
import { enrollmentService } from "~/services/enrollment.service";
import { enumService } from "~/services/enum.service";

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
  const requestedType = searchParams.get("type");
  const initialType = requestedType === "Regular" || requestedType === "Irregular" ? requestedType : "all";

  const { context: termContext } = useTermContext();
  const syId = termContext?.selection.syId ?? null;
  const semesterNumber = termContext?.selection.semesterNumber ?? null;
  const enabled = syId != null && semesterNumber != null;
  const termKey = enabled ? `${syId}:${semesterNumber}` : "none";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [stateFilter, setStateFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [setFilter, setSetFilter] = useState("all");
  const pageSize = 20;
  const debouncedSearch = useDebounce(search, 300);
  const requestKey = [
    debouncedSearch.trim(),
    typeFilter,
    stateFilter,
    programFilter,
    yearFilter,
    setFilter,
  ].join("|");

  const { data: enrollmentData, error: loadError, reload: reloadStudents } = useCachedData(
    `enrollment-records:${termKey}:p${page}:${requestKey}`,
    () => enrollmentService.listTermEnrollments(
      syId as number,
      semesterNumber as number,
      page,
      pageSize,
      {
        search: debouncedSearch,
        enrolledStatus: typeFilter,
        enrollmentState: stateFilter,
        program: programFilter,
        yearLevel: yearFilter,
        set: setFilter,
      },
    ),
    { enabled, keepPreviousData: true },
  );
  const students = enrollmentData?.items ?? null;
  const totalItems = enrollmentData?.total ?? 0;
  const { data: facets, reload: reloadFacets } = useCachedData(
    `enrollment-facets:${termKey}`,
    () => enrollmentService.getFacets(syId as number, semesterNumber as number),
    { enabled },
  );
  const { data: enumOptions } = useCachedData("enums", () => enumService.getOptions());

  async function refetch() {
    await Promise.all([reloadStudents(), reloadFacets()]);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
  }

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Enrollment Records"
        actions={
          <Button type="button" block={false} onClick={() => navigate("/enrollment/new")}>
            <PlusIcon />
            Add Records
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
            genders={enumOptions?.gender ?? []}
            nameSuffixes={enumOptions?.nameSuffix ?? []}
            onChanged={refetch}
            search={search}
            onSearchChange={(value) => updateFilter(setSearch, value)}
            typeFilter={typeFilter}
            onTypeFilterChange={(value) => updateFilter(setTypeFilter, value)}
            stateFilter={stateFilter}
            onStateFilterChange={(value) => updateFilter(setStateFilter, value)}
            programFilter={programFilter}
            onProgramFilterChange={(value) => updateFilter(setProgramFilter, value)}
            yearFilter={yearFilter}
            onYearFilterChange={(value) => updateFilter(setYearFilter, value)}
            setFilter={setFilter}
            onSetFilterChange={(value) => updateFilter(setSetFilter, value)}
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
