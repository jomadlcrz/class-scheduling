import { useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ScheduleTermFilter } from "~/features/schedules/schedule-term-filter";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { useMySchedule } from "~/features/schedules/use-my-schedule";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";

export function meta() {
  return [
    { title: "My Schedule — GWC Class Scheduling" },
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
  const { semesters, semesterLabel, loading: semestersLoading } = useSemesters();
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");

  // The backend already scopes rows to this instructor via the JWT (RegularSchedule.faculty_id).
  const {
    isLoading,
    loadError,
    schoolYear,
    setSchoolYear,
    semester,
    setSemester,
    schoolYears,
    visibleSchedules,
  } = useMySchedule();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="My Teaching Schedule"
        description="The classes you teach this academic term."
      />

      {loadError ? (
        <EmptyState title="Couldn't load your schedule">{loadError}</EmptyState>
      ) : (
        <>
          <ScheduleTermFilter
            idPrefix="fs"
            isLoading={isLoading}
            schoolYears={schoolYears}
            schoolYear={schoolYear}
            onSchoolYearChange={setSchoolYear}
            semestersLoading={semestersLoading}
            semesters={semesters}
            semester={semester}
            onSemesterChange={setSemester}
            semesterLabel={semesterLabel}
          />

          <ScheduleViewer
            schedules={visibleSchedules}
            isLoading={isLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            emptyTitle="No classes scheduled"
            emptyMessage="You have no classes for the selected term."
          />
        </>
      )}
    </div>
  );
}
