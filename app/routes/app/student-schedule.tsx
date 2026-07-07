import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Select } from "~/components/ui/select";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { useAuth } from "~/hooks/use-auth";
import { PageHeader } from "~/layouts/page-header";
import { scheduleService } from "~/services/schedule.service";
import { studentService } from "~/services/student.service";
import {
  DAYS,
  DEFAULT_SCHOOL_YEAR,
  SCHEDULE_SEMESTER_LABELS,
  SCHEDULE_SEMESTERS,
  SCHOOL_YEARS,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";
import type { Student } from "~/types/student";

export function meta() {
  return [
    { title: "My Schedule — GWC Class Scheduling" },
    { name: "description", content: "Your class schedule for the current academic term." },
  ];
}

export default function StudentScheduleRoute() {
  return (
    <RoleGuard allow={["student"]}>
      <StudentSchedulePage />
    </RoleGuard>
  );
}

function StudentSchedulePage() {
  const { user } = useAuth();
  const studentId = user?.studentId;

  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [schoolYear, setSchoolYear] = useState(DEFAULT_SCHOOL_YEAR);
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("grid");

  useEffect(() => {
    Promise.all([scheduleService.list(), studentService.list()]).then(
      ([scheduleList, students]) => {
        setSchedules(scheduleList);
        setStudent(students.find((s) => s.id === studentId) ?? null);
      },
    );
  }, [studentId]);

  const visibleSchedules = useMemo(() => {
    if (!schedules || !student) return [];
    return schedules
      .filter(
        (s) =>
          s.program === student.program &&
          s.yearLevel === student.yearLevel &&
          s.setCode === student.setCode &&
          s.schoolYear === schoolYear &&
          s.semester === semester,
      )
      .sort(
        (a, b) =>
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
      );
  }, [schedules, student, schoolYear, semester]);

  const sectionLabel = student
    ? `${student.program}-${student.yearLevel}${student.setCode}`
    : "—";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="My Class Schedule"
        description={`Your weekly class schedule this academic term (Section ${sectionLabel}).`}
      />

      {/* Term selectors */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <Select
            id="stu-sched-year"
            label="School Year"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
          >
            {SCHOOL_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select
            id="stu-sched-sem"
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
        emptyTitle="No classes scheduled"
        emptyMessage="There are no classes for your section in the selected term."
      />
    </div>
  );
}
