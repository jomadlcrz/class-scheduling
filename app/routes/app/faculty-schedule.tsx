import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { ResultState } from "~/components/feedback/result-state";
import { Select } from "~/components/ui/select";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { useAuth } from "~/hooks/use-auth";
import { PageHeader } from "~/layouts/page-header";
import { scheduleService } from "~/services/schedule.service";
import {
  DAYS,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";
import { useSchoolYears } from "~/hooks/use-school-years";

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
  const { user } = useAuth();
  const { defaultSchoolYear } = useSchoolYears();
  const facultyId = user?.facultyId;

  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [schoolYear, setSchoolYear] = useState(defaultSchoolYear);
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("grid");

  // useEffect(() => {
  //   scheduleService.list().then(setSchedules);
  // }, []);

  const visibleSchedules = useMemo(() => {
    if (!schedules || !facultyId) return [];
    return schedules
      .filter(
        (s) => s.facultyId === facultyId && s.schoolYear === schoolYear && s.semester === semester,
      )
      .sort(
        (a, b) =>
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
      );
  }, [schedules, facultyId, schoolYear, semester]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="My Teaching Schedule"
        description="The classes you teach this academic term."
      />

      <ResultState tone="error" title="Not available">
        This feature is not connected to the backend yet.
      </ResultState>
    </div>
  );
}
