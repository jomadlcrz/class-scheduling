import { apiGet } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type {
  InstructorAssignedSubject,
  InstructorSubjectSession,
  InstructorTeachingLoad,
} from "~/types/instructor-load";
import type { InstructorAnalytics } from "~/types/instructor-analytics";
import type { StudentAnalytics } from "~/types/student-analytics";
import type { SuperAdminAnalytics } from "~/types/super-admin-analytics";

export type InstructorSubjectStatus = "all" | "scheduled" | "awaiting";

/** GET /super-admin/analytics — system-wide account and RBAC snapshot. */
async function getAdmin(): Promise<SuperAdminAnalytics> {
  return apiGet<SuperAdminAnalytics>("/super-admin/analytics");
}

/** GET /students/me/analytics — current student's term-scoped schedule. */
async function getStudent(syId: number, semesterNumber: number): Promise<StudentAnalytics> {
  return apiGet<StudentAnalytics>(`/students/me/analytics${termScopeQuery(syId, semesterNumber)}`);
}

/** GET /instructor/analytics — current faculty member's term-scoped load. */
async function getFaculty(syId: number, semesterNumber: number): Promise<InstructorAnalytics> {
  return apiGet<InstructorAnalytics>(`/instructor/analytics${termScopeQuery(syId, semesterNumber)}`);
}

type RawSession = {
  regular_sched_id?: number | null;
  day?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  hours?: number | null;
  class_mode?: string | null;
  room?: string | null;
  room_capacity?: number | null;
  number_of_students?: number | null;
  program?: string | null;
  year_level?: number | null;
  set_code?: string | null;
};

type RawSubject = {
  subject_id?: number | null;
  subject_code?: string | null;
  descriptive_title?: string | null;
  subject_type?: string | null;
  units?: number | null;
  lec_hours?: number | null;
  lab_hours?: number | null;
  program_abbrev?: string | null;
  program_name?: string | null;
  year_level?: number | null;
  expected_weekly_hours?: number | null;
  student_count?: number | null;
  is_scheduled?: boolean;
  sessions?: RawSession[];
};

type RawInstructorAnalytics = {
  meta?: {
    instructor_name?: string | null;
    school_year?: string | null;
    semester_number?: number | null;
    timetable_visible?: boolean;
  };
  summary?: Record<string, number | null>;
  subjects?: RawSubject[];
};

function num(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapSession(raw: RawSession): InstructorSubjectSession {
  return {
    regularSchedId: raw.regular_sched_id ?? null,
    day: raw.day ?? null,
    startTime: raw.start_time ?? null,
    endTime: raw.end_time ?? null,
    hours: num(raw.hours),
    classMode: raw.class_mode ?? null,
    room: raw.room ?? null,
    roomCapacity: typeof raw.room_capacity === "number" ? raw.room_capacity : null,
    numberOfStudents: num(raw.number_of_students),
    program: raw.program ?? null,
    yearLevel: raw.year_level ?? null,
    setCode: raw.set_code ?? null,
  };
}

function mapSubject(raw: RawSubject): InstructorAssignedSubject {
  return {
    subjectId: raw.subject_id ?? null,
    subjectCode: raw.subject_code ?? null,
    descriptiveTitle: raw.descriptive_title ?? null,
    subjectType: raw.subject_type ?? null,
    units: num(raw.units),
    lecHours: num(raw.lec_hours),
    labHours: num(raw.lab_hours),
    programAbbrev: raw.program_abbrev ?? null,
    programName: raw.program_name ?? null,
    yearLevel: raw.year_level ?? null,
    expectedWeeklyHours: num(raw.expected_weekly_hours),
    studentCount: num(raw.student_count),
    isScheduled: raw.is_scheduled === true,
    sessions: (raw.sessions ?? []).map(mapSession),
  };
}

/** GET /instructor/analytics typed as InstructorTeachingLoad */
async function getFacultyLoad(syId: number, semesterNumber: number): Promise<InstructorTeachingLoad> {
  const data = await apiGet<RawInstructorAnalytics>(
    `/instructor/analytics${termScopeQuery(syId, semesterNumber)}`,
  );
  const summary = data.summary ?? {};

  return {
    instructorName: data.meta?.instructor_name ?? null,
    schoolYear: data.meta?.school_year ?? null,
    semesterNumber: data.meta?.semester_number ?? null,
    timetableVisible: data.meta?.timetable_visible !== false,
    summary: {
      maxWeeklyHours: num(summary.max_weekly_hours),
      bookedHours: num(summary.booked_hours),
      remainingHours: num(summary.remaining_hours),
      loadPercent: num(summary.load_percent),
      expectedWeeklyHours: num(summary.expected_weekly_hours),
      assignedSubjects: num(summary.assigned_subjects),
      scheduledSubjects: num(summary.scheduled_subjects),
      sessions: num(summary.sessions),
      units: num(summary.units),
    },
    subjects: (data.subjects ?? []).map(mapSubject),
  };
}

/** GET /instructor/subjects/search — caller's own assigned subjects filtered by search/status */
async function searchFacultySubjects(
  syId: number,
  semesterNumber: number,
  query: string,
  status: InstructorSubjectStatus = "all",
): Promise<InstructorAssignedSubject[]> {
  const data = await apiGet<{ subjects?: RawSubject[] }>(
    `/instructor/subjects/search${termScopeQuery(syId, semesterNumber, { q: query, status })}`,
  );
  return (data.subjects ?? []).map(mapSubject);
}

export const selfAnalyticsService = {
  getAdmin,
  getStudent,
  getFaculty,
  getFacultyLoad,
  searchFacultySubjects,
};
