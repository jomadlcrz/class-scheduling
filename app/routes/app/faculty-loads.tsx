import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { TableSkeleton } from "~/components/ui/skeleton";
import { DeanFacultyLoadsView } from "~/features/faculty/dean-faculty-loads-view";
import { useDeanFacultyLoading } from "~/features/faculty/use-dean-faculty-loading";

export function meta() {
  return [
    { title: "Faculty Loads — GWC Class Scheduling" },
    { name: "description", content: "View faculty subject assignments for a school year and semester." },
  ];
}

export default function FacultyLoadsRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <FacultyLoadsPage />
    </RoleGuard>
  );
}

function FacultyLoadsPage() {
  const {
    isLoading,
    loadError,
    termsLoading,
    semestersLoading,
    entries,
    selectedEntry,
    selectedIndex,
    setSelectedIndex,
    schoolYearLabel,
    schoolYears,
    selectedSchoolYearId,
    setSelectedSchoolYearId,
    semesterName,
    semesters,
    semesterLabel,
    selectedSemesterNumber,
    setSelectedSemesterNumber,
  } = useDeanFacultyLoading();

  const contextReady = Boolean(selectedSchoolYearId && selectedSemesterNumber);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {loadError && isLoading ? (
        <EmptyState title="Couldn't load faculty loads">{loadError}</EmptyState>
      ) : !contextReady || termsLoading || semestersLoading ? (
        <div className="mt-8">
          <TableSkeleton columns={6} rows={8} />
        </div>
      ) : (
        <DeanFacultyLoadsView
          entry={selectedEntry}
          isLoading={isLoading}
          entries={entries ?? []}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
          schoolYearLabel={schoolYearLabel}
          schoolYears={schoolYears}
          selectedSchoolYearId={selectedSchoolYearId}
          onSchoolYearChange={setSelectedSchoolYearId}
          semesterName={semesterName}
          semesters={semesters}
          selectedSemesterNumber={selectedSemesterNumber}
          onSemesterChange={setSelectedSemesterNumber}
          semesterLabel={semesterLabel}
        />
      )}
    </div>
  );
}
