import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { FacultyScheduleView } from "~/features/schedules/faculty-schedule-view";
import { useFacultyLoading } from "~/features/schedules/use-faculty-loading";
import { useSemesters } from "~/hooks/use-semesters";

export function meta() {
  return [
    { title: "Faculty Loading — GWC Class Scheduling" },
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
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
  );
}
