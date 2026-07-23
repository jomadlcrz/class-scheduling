import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Spinner } from "~/components/ui/spinner";
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
    selectedSemesterId,
    setSelectedSemesterId,
  } = useDeanFacultyLoading();

  const contextReady = Boolean(selectedSchoolYearId && selectedSemesterId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {loadError ? (
        <EmptyState title="Couldn't load faculty loads">{loadError}</EmptyState>
      ) : !contextReady || termsLoading || semestersLoading ? (
        <div
          role="status"
          aria-label="Loading"
          className="mt-8 grid place-items-center text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : isLoading ? (
        <div
          role="status"
          aria-label="Loading faculty loads"
          className="mt-8 grid place-items-center text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : !entries || entries.length === 0 ? (
        <EmptyState title="No faculty loads yet">
          No faculty have been assigned subjects for this term yet.
        </EmptyState>
      ) : (
        <DeanFacultyLoadsView
          entry={selectedEntry}
          isLoading={isLoading}
          entries={entries}
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
          schoolYearLabel={schoolYearLabel}
          schoolYears={schoolYears}
          selectedSchoolYearId={selectedSchoolYearId}
          onSchoolYearChange={setSelectedSchoolYearId}
          semesterName={semesterName}
          semesters={semesters}
          selectedSemesterId={selectedSemesterId}
          onSemesterChange={setSelectedSemesterId}
          semesterLabel={semesterLabel}
        />
      )}
    </div>
  );
}
