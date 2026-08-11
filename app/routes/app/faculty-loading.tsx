import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { IconButton } from "~/components/ui/icon-button";
import { PrinterIcon } from "~/components/ui/icons";
import { FacultyScheduleView } from "~/features/schedules/faculty-schedule-view";
import { openFacultyLoadingPrint } from "~/features/faculty/print-faculty-loading";
import { useFacultyLoading } from "~/features/schedules/use-faculty-loading";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";

export function meta() {
  return [
    { title: "My Faculty Load — GWC Class Scheduling" },
    { name: "description", content: "Your teaching load for the current academic term." },
  ];
}

export default function FacultyLoadingRoute() {
  return (
    <RoleGuard allow={["faculty"]}>
      <FacultyLoadingPage />
    </RoleGuard>
  );
}

function FacultyLoadingPage() {
  const { semesters, semesterLabel } = useSemesters();

  const {
    isLoading,
    loadError,
    schoolYear,
    setSchoolYear,
    semester,
    setSemester,
    schoolYears,
    entry,
  } = useFacultyLoading();

  const semesterName = semesterLabel(semester);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="My Faculty Load"
        actions={
          <IconButton
            variant="neutral"
            onClick={() => {
              if (entry) openFacultyLoadingPrint(entry, { schoolYear: schoolYear, semesterLabel: semesterName });
            }}
            disabled={!entry}
            label="Print faculty loading"
            title="Print"
          >
            <PrinterIcon size={18} />
          </IconButton>
        }
      />
      <div className="mt-6">
        {loadError ? (
          <EmptyState title="Couldn't load your loading">{loadError}</EmptyState>
        ) : (
          <FacultyScheduleView
            entry={entry}
            isLoading={isLoading}
            schoolYears={schoolYears}
            schoolYear={schoolYear}
            schoolYearLabel={schoolYear}
            onSchoolYearChange={setSchoolYear}
            semesters={semesters}
            semester={semester}
            semesterName={semesterLabel(semester)}
            onSemesterChange={setSemester}
            semesterLabel={semesterLabel}
          />
        )}
      </div>
    </div>
  );
}
