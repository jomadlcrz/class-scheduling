import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { TableSkeleton } from "~/components/ui/skeleton";
import { IconButton } from "~/components/ui/icon-button";
import { PrinterIcon } from "~/components/ui/icons";
import { DeanFacultyLoadsView } from "~/features/faculty/dean-faculty-loads-view";
import { openFacultyLoadingPrint } from "~/features/faculty/print-faculty-loading";
import { useDeanFacultyLoading } from "~/features/faculty/use-dean-faculty-loading";
import { PageHeader } from "~/layouts/page-header";

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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Faculty Loads"
        actions={
          <IconButton
            variant="neutral"
            onClick={() => {
              if (selectedEntry) openFacultyLoadingPrint(selectedEntry, { schoolYear: schoolYearLabel, semesterLabel: semesterName });
            }}
            disabled={!selectedEntry}
            label="Print faculty loading"
            title="Print"
          >
            <PrinterIcon size={18} />
          </IconButton>
        }
      />
      <div className="mt-6">
        {loadError && isLoading ? (
          <EmptyState title="Couldn't load faculty loads">{loadError}</EmptyState>
        ) : !contextReady || termsLoading || semestersLoading ? (
          <TableSkeleton columns={6} rows={8} />
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
    </div>
  );
}
