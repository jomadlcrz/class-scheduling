import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Spinner } from "~/components/ui/spinner";
import { FacultyScheduleView } from "~/features/schedules/faculty-schedule-view";
import { useFacultyLoading } from "~/features/schedules/use-faculty-loading";
import { useSemesters } from "~/hooks/use-semesters";

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
    entry,
  } = useFacultyLoading();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {loadError ? (
        <EmptyState title="Couldn't load your schedule">{loadError}</EmptyState>
      ) : (
        <FacultyScheduleView
          entry={entry}
          isLoading={isLoading}
          schoolYears={schoolYears}
          schoolYear={schoolYear}
          onSchoolYearChange={setSchoolYear}
          semesters={semesters}
          semester={semester}
          onSemesterChange={setSemester}
          semesterLabel={semesterLabel}
        />
      )}
    </div>
  );
}
