import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Spinner } from "~/components/ui/spinner";
import { FacultyScheduleView } from "~/features/schedules/faculty-schedule-view";
import { ScheduleTermFilter } from "~/features/schedules/schedule-term-filter";
import { useFacultyLoading } from "~/features/schedules/use-faculty-loading";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";

export function meta() {
  return [
    { title: "Faculty Loading — GWC Class Scheduling" },
    { name: "description", content: "Your teaching schedule for the current academic term." },
  ];
}

export default function FacultyScheduleRoute() {
  return (
    <RoleGuard allow={["faculty"]}>
      <FacultySchedulePage />
    </RoleGuard>
  );
}

function FacultySchedulePage() {
  const { semesters, semesterLabel } = useSemesters();

  const {
    isLoading,
    loadError,
    schoolYear,
    setSchoolYear,
    semester,
    setSemester,
    schoolYears,
    termsLoading,
    entry,
  } = useFacultyLoading();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Faculty Loading"
      />

      {loadError ? (
        <EmptyState title="Couldn't load your schedule">{loadError}</EmptyState>
      ) : (
        <>
          <ScheduleTermFilter
            idPrefix="fs"
            isLoading={termsLoading}
            schoolYears={schoolYears}
            schoolYear={schoolYear}
            onSchoolYearChange={setSchoolYear}
            semestersLoading={semesters.length === 0}
            semesters={semesters}
            semester={semester}
            onSemesterChange={setSemester}
            semesterLabel={semesterLabel}
          />

          {isLoading ? (
            <div
              role="status"
              aria-label="Loading schedule"
              className="mt-8 grid place-items-center text-navy-700 dark:text-slate-200"
            >
              <Spinner />
            </div>
          ) : !entry ? (
            <EmptyState title="No classes scheduled">
              You have no classes for the selected term.
            </EmptyState>
          ) : (
            <div className="mt-4">
              <FacultyScheduleView entry={entry} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
