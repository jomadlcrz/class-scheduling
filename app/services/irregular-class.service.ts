import { ApiError, apiGet, apiMessage, apiPost } from "~/lib/api";

/** Irregular students and their enrolled subjects (registrar_admin schedules module). */

type IrregularAcademicRecord = {
  student_academic_id: number;
  year_level: number;
  program: string;
  set: string | null;
  enrolled_status: string;
  student_type: string;
  school_year: string | null;
  semester: string | null;
  enrolled_subjects: {
    subject_id: number;
    subject_code: string;
    descriptive_title: string;
    units: number;
  }[];
};

type IrregularStudentsResponse = {
  student_profile_id: number;
  student_id: string | null;
  first_name: string;
  mid_name: string | null;
  last_name: string;
  mobile: string | null;
  email: string | null;
  account_status: string;
  academics: IrregularAcademicRecord[];
}[];

export type IrregularStudent = {
  /** Real, always-unique primary key — use this for identity (list keys, selection), never studentId. */
  studentProfileId: number;
  /** Display-only school ID number; can be null (irregular students aren't required to have one assigned yet). */
  studentId: string | null;
  studentName: string;
  email: string | null;
  programTaken: string;
  subjectsEnrolled: { subjectId: number; subjectCode: string; descTitle: string; units: number }[];
};

/** "2nd Semester" sorts after "1st Semester" — only these two values occur here. */
function semesterRank(semester: string | null): number {
  return semester?.startsWith("2") ? 2 : 1;
}

/** Picks the most recent academic record (by school year, then semester) — that term's subjects are what's shown. */
function latestAcademic(academics: IrregularAcademicRecord[]): IrregularAcademicRecord | null {
  if (academics.length === 0) return null;
  return [...academics].sort(
    (a, b) =>
      (b.school_year ?? "").localeCompare(a.school_year ?? "") ||
      semesterRank(b.semester) - semesterRank(a.semester),
  )[0];
}

/** GET /students/irregular — students flagged AcademicStatus.IRREGULAR. 404 → empty. */
async function listStudents(): Promise<IrregularStudent[]> {
  let data: IrregularStudentsResponse;
  try {
    data = await apiGet<IrregularStudentsResponse>("/students/irregular");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((s) => {
    const current = latestAcademic(s.academics);
    return {
      studentProfileId: s.student_profile_id,
      studentId: s.student_id,
      studentName: `${s.last_name}, ${s.first_name}`,
      email: s.email,
      programTaken: current?.program ?? "—",
      subjectsEnrolled: (current?.enrolled_subjects ?? []).map((sub) => ({
        subjectId: sub.subject_id,
        subjectCode: sub.subject_code,
        descTitle: sub.descriptive_title,
        units: sub.units,
      })),
    };
  });
}

type PendingScheduleResponse = {
  irregular_students: {
    student_academic_id: number;
    student_profile_id: number;
    student_id: string | null;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    pending_subjects: {
      subject_id: number;
      subject_code: string;
      descriptive_title: string;
      units: number;
      available_schedules: {
        regular_sched_id: number;
        mode: string;
        set: string | null;
        day_of_week: string;
        start_time: string;
        end_time: string;
        room: string | null;
        instructor: string | null;
      }[];
    }[];
  }[];
};

export type AvailableSchedule = {
  regularSchedId: number;
  mode: string;
  set: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  instructor: string | null;
};

export type PendingSubject = {
  subjectId: number;
  subjectCode: string;
  descTitle: string;
  units: number;
  availableSchedules: AvailableSchedule[];
};

export type StudentPendingSchedule = {
  studentAcademicId: number;
  studentProfileId: number;
  studentId: string | null;
  studentName: string;
  pendingSubjects: PendingSubject[];
};

/** GET /regular_schedule/irregular-students-pending-schedule — irregular students still missing a schedule for this term. */
async function listPendingSchedule(syId: number, semId: number): Promise<StudentPendingSchedule[]> {
  const query = new URLSearchParams({ sy_id: String(syId), sem_id: String(semId) });
  const data = await apiGet<PendingScheduleResponse>(
    `/regular_schedule/irregular-students-pending-schedule?${query}`,
  );
  return data.irregular_students.map((s) => ({
    studentAcademicId: s.student_academic_id,
    studentProfileId: s.student_profile_id,
    studentId: s.student_id,
    studentName: `${s.last_name}, ${s.first_name}`,
    pendingSubjects: s.pending_subjects.map((ps) => ({
      subjectId: ps.subject_id,
      subjectCode: ps.subject_code,
      descTitle: ps.descriptive_title,
      units: ps.units,
      availableSchedules: ps.available_schedules.map((av) => ({
        regularSchedId: av.regular_sched_id,
        mode: av.mode,
        set: av.set,
        dayOfWeek: av.day_of_week,
        startTime: av.start_time,
        endTime: av.end_time,
        room: av.room,
        instructor: av.instructor,
      })),
    })),
  }));
}

/** POST /regular_schedule/create-irregular-schedule — assigns regular schedule slot(s) to an irregular student's term. */
async function assign(input: { studentAcademicId: number; regularSchedIds: number[] }): Promise<string> {
  const data = await apiPost<{ message?: string }>("/regular_schedule/create-irregular-schedule", {
    studentAcademicId: input.studentAcademicId,
    regularSchedIds: input.regularSchedIds,
  });
  return apiMessage(data);
}

export const irregularClassService = { listStudents, listPendingSchedule, assign };
