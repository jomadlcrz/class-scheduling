import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { ResultState } from "~/components/feedback/result-state";
import { CalendarIcon, PrinterIcon, UserCheckIcon, BookIcon } from "~/components/ui/icons";
import { Tooltip } from "~/components/ui/tooltip";
import { MobileWeeklySchedule } from "~/features/schedules/mobile-weekly-schedule";
import { ScheduleKpiCard } from "~/features/schedules/schedule-kpi-card";
import { ScheduleViewer } from "~/features/schedules/schedule-viewer";
import type { ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { TodayClasses } from "~/features/schedules/today-classes";
import { useAuth } from "~/hooks/use-auth";
import { PageHeader } from "~/layouts/page-header";
import { scheduleService } from "~/services/schedule.service";
import { studentService } from "~/services/student.service";
import { subjectService } from "~/services/subject.service";
import {
  DAYS,
  DEFAULT_SCHOOL_YEAR,
  SCHEDULE_SEMESTER_LABELS,
  type Schedule,
  type ScheduleSemester,
} from "~/types/schedule";
import { STUDENT_STATUS_LABELS, type Student, type StudentStatus } from "~/types/student";
import type { Subject } from "~/types/subject";
import type { BadgeTone } from "~/components/ui/badge";

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

const STATUS_TONE: Record<StudentStatus, BadgeTone> = {
  enrolled: "emerald",
  inactive: "slate",
  graduated: "gold",
};

function StudentSchedulePage() {
  const { user } = useAuth();
  const studentId = user?.studentId;

  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const schoolYear = DEFAULT_SCHOOL_YEAR;
  const semester: ScheduleSemester = 1;
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("grid");

  // useEffect(() => {
  //   Promise.all([scheduleService.list(), studentService.list(), subjectService.list()]).then(
  //     ([scheduleList, students, subjectList]) => {
  //       setSchedules(scheduleList);
  //       setStudent(students.find((s) => s.id === studentId) ?? null);
  //       setSubjects(subjectList);
  //     },
  //   );
  // }, [studentId]);

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

  const totalUnits = useMemo(() => {
    if (!subjects) return 0;
    const seen = new Set<string>();
    let sum = 0;
    for (const s of visibleSchedules) {
      if (seen.has(s.subjectId)) continue;
      seen.add(s.subjectId);
      sum += subjects.find((sub) => sub.id === s.subjectId)?.units ?? 0;
    }
    return sum;
  }, [visibleSchedules, subjects]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader title="My Class Schedule" />

      <ResultState tone="error" title="Not available">
        This feature is not connected to the backend yet.
      </ResultState>
    </div>
  );
}

function PrintScheduleButton() {
  return (
    <Tooltip label="Print schedule">
      <button
        type="button"
        aria-label="Print schedule"
        onClick={() => window.print()}
        className="grid size-9 cursor-pointer place-items-center rounded-lg border border-slate-300 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <PrinterIcon />
      </button>
    </Tooltip>
  );
}
