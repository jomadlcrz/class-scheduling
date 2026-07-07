import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Select } from "~/components/ui/select";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { useAuth } from "~/hooks/use-auth";
import { PageHeader } from "~/layouts/page-header";
import { scheduleService } from "~/services/schedule.service";
import {
  DAYS,
  DEFAULT_SCHOOL_YEAR,
  SCHEDULE_SEMESTER_LABELS,
  SCHEDULE_SEMESTERS,
  SCHOOL_YEARS,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";

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
  const facultyId = user?.facultyId;

  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [schoolYear, setSchoolYear] = useState(DEFAULT_SCHOOL_YEAR);
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("grid");

  useEffect(() => {
    scheduleService.list().then(setSchedules);
  }, []);

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
    <>
      <PageHeader
        title="My Teaching Schedule"
        description="The classes you teach this academic term."
      />

      {/* Term selectors */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <Select
            id="fac-sched-year"
            label="School Year"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
          >
            {SCHOOL_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select
            id="fac-sched-sem"
            label="Semester"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value) as ScheduleSemester)}
          >
            {SCHEDULE_SEMESTERS.map((s) => (
              <option key={s} value={s}>{SCHEDULE_SEMESTER_LABELS[s]}</option>
            ))}
          </Select>
        </div>
      </div>

      <ScheduleViewer
        schedules={visibleSchedules}
        isLoading={schedules === null}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        emptyTitle="No classes assigned"
        emptyMessage="You have no classes scheduled for the selected term."
      />
    </>
  );
}
