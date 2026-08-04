import { ApiError, apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import { appendTermScopeParams, termScopeQuery } from "~/lib/term-scope";

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
  student_full_name: string;
  mobile: string | null;
  email: string | null;
  profile_photo_url: string | null;
  account_status: string;
  academics: IrregularAcademicRecord[];
}[];

export type IrregularStudent = {
  /** Real, always-unique primary key — use this for identity (list keys, selection), never studentId. */
  studentProfileId: number;
  /** Display-only school ID number; can be null (irregular students aren't required to have one assigned yet). */
  studentId: string | null;
  firstName: string;
  midName: string | null;
  lastName: string;
  studentName: string;
  mobile: string | null;
  email: string | null;
  profilePhotoUrl: string | null;
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

function mapIrregularStudents(data: IrregularStudentsResponse): IrregularStudent[] {
  return data.map((s) => {
    const current = latestAcademic(s.academics);
    return {
      studentProfileId: s.student_profile_id,
      studentId: s.student_id,
      firstName: "",
      midName: null,
      lastName: "",
      studentName: s.student_full_name,
      mobile: s.mobile,
      email: s.email,
      profilePhotoUrl: s.profile_photo_url,
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

/** GET /students/irregular — irregular students enrolled in the selected term. 404 → empty. */
async function listStudents(syId: number, semesterNumber: number): Promise<IrregularStudent[]> {
  let data: IrregularStudentsResponse;
  try {
    data = await apiGet<IrregularStudentsResponse>(
      `/students/irregular${termScopeQuery(syId, semesterNumber)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return mapIrregularStudents(data);
}

/** GET /students/irregular/pending-schedule — irregular students who still need scheduling for a term. */
async function listPendingStudents(syId: number, semesterNumber: number): Promise<IrregularStudent[]> {
  const data = await apiGet<IrregularStudentsResponse>(
    `/students/irregular/pending-schedule${termScopeQuery(syId, semesterNumber)}`,
  );
  return mapIrregularStudents(data);
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
      available_offerings: {
        set: string | null;
        set_id: number;
        regular_sched_ids: number[];
        meeting_count: number;
        days: string;
        instructors: string[];
        meetings: {
          regular_sched_id: number;
          mode: string;
          day_of_week: string;
          start_time: string;
          end_time: string;
          room: string | null;
          instructor: string | null;
        }[];
      }[];
    }[];
    scheduled_subjects: {
      subject_id: number;
      subject_code: string;
      descriptive_title: string;
      units: number;
      assigned_offering: {
        set: string | null;
        set_id: number;
        regular_sched_ids: number[];
        meeting_count: number;
        days: string;
        instructors: string[];
        meetings: {
          regular_sched_id: number;
          mode: string;
          day_of_week: string;
          start_time: string;
          end_time: string;
          room: string | null;
          instructor: string | null;
        }[];
      };
    }[];
  }[];
};

type MeetingSlot = {
  regularSchedId: number;
  mode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  instructor: string | null;
};

type AvailableOffering = {
  set: string | null;
  setId: number;
  regularSchedIds: number[];
  meetingCount: number;
  days: string;
  instructors: string[];
  recommended: boolean;
  meetings: MeetingSlot[];
};

type ScheduledSubject = {
  subjectId: number;
  subjectCode: string;
  descTitle: string;
  units: number;
  assignedOffering: AvailableOffering;
};

type PendingSubject = {
  subjectId: number;
  subjectCode: string;
  descTitle: string;
  units: number;
  availableOfferings: AvailableOffering[];
};

export type StudentPendingSchedule = {
  studentAcademicId: number;
  studentProfileId: number;
  studentId: string | null;
  studentName: string;
  pendingSubjects: PendingSubject[];
  scheduledSubjects: ScheduledSubject[];
};

function mapMeeting(m: PendingScheduleResponse["irregular_students"][0]["pending_subjects"][0]["available_offerings"][0]["meetings"][0]): MeetingSlot {
  return {
    regularSchedId: m.regular_sched_id,
    mode: m.mode,
    dayOfWeek: m.day_of_week,
    startTime: m.start_time,
    endTime: m.end_time,
    room: m.room,
    instructor: m.instructor,
  };
}

function mapOffering(o: { set: string | null; set_id: number; regular_sched_ids: number[]; meeting_count: number; days: string; instructors: string[]; recommended?: boolean; meetings: { regular_sched_id: number; mode: string; day_of_week: string; start_time: string; end_time: string; room: string | null; instructor: string | null }[] }): AvailableOffering {
  return {
    set: o.set,
    setId: o.set_id,
    regularSchedIds: o.regular_sched_ids,
    meetingCount: o.meeting_count,
    days: o.days,
    instructors: o.instructors,
    recommended: o.recommended ?? false,
    meetings: o.meetings.map(mapMeeting),
  };
}

/** GET /regular_schedule/irregular-students-pending-schedule — irregular students still missing a schedule for this term. */
async function listPendingSchedule(syId: number, semesterNumber: number): Promise<StudentPendingSchedule[]> {
  const data = await apiGet<PendingScheduleResponse>(
    `/regular_schedule/irregular-students-pending-schedule${termScopeQuery(syId, semesterNumber)}`,
  );
  return data.irregular_students.map((s) => ({
    studentAcademicId: s.student_academic_id,
    studentProfileId: s.student_profile_id,
    studentId: s.student_id,
    studentName: `${s.last_name}, ${s.first_name} ${s.mid_name ?? ""}`.trim(),
    pendingSubjects: s.pending_subjects.map((ps) => ({
      subjectId: ps.subject_id,
      subjectCode: ps.subject_code,
      descTitle: ps.descriptive_title,
      units: ps.units,
      availableOfferings: ps.available_offerings.map(mapOffering),
    })),
    scheduledSubjects: (s.scheduled_subjects ?? []).map((ss) => ({
      subjectId: ss.subject_id,
      subjectCode: ss.subject_code,
      descTitle: ss.descriptive_title,
      units: ss.units,
      assignedOffering: mapOffering(ss.assigned_offering),
    })),
  }));
}

type AssignedScheduleResponse = {
  irregular_schedules: {
    student_academic_id: number;
    student_id: string | null;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    schedules: {
      id: number;
      regular_sched_id: number;
      subject_id: number;
      subject_code: string;
      descriptive_title: string;
      units: number;
      mode: string;
      set: string | null;
      school_year: string | null;
      semester: number | null;
      program: string | null;
      day_of_week: string;
      start_time: string;
      end_time: string;
      room: string | null;
      instructor: string | null;
    }[];
  }[];
};

type AssignedSchedule = {
  id: number;
  regularSchedId: number;
  subjectId: number;
  subjectCode: string;
  descTitle: string;
  units: number;
  mode: string;
  set: string | null;
  schoolYear: string | null;
  semester: number | null;
  program: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  instructor: string | null;
};

type AssignedSubject = {
  subjectId: number;
  subjectCode: string;
  descTitle: string;
  units: number;
  schedules: AssignedSchedule[];
};

export type StudentAssignedSchedule = {
  studentAcademicId: number;
  studentId: string | null;
  studentName: string;
  assignedSubjects: AssignedSubject[];
};

/** GET /irregular_schedule — irregular students with assigned schedules, optionally filtered by term. */
async function listAssignedSchedule(syId: number, semesterNumber: number): Promise<StudentAssignedSchedule[]> {
  const data = await apiGet<AssignedScheduleResponse>(
    `/irregular_schedule${termScopeQuery(syId, semesterNumber)}`,
  );
  return data.irregular_schedules.map((s) => {
    const subjectsMap = new Map<number, AssignedSubject>();
    for (const sc of s.schedules) {
      let subject = subjectsMap.get(sc.subject_id);
      if (!subject) {
        subject = {
          subjectId: sc.subject_id,
          subjectCode: sc.subject_code,
          descTitle: sc.descriptive_title,
          units: sc.units,
          schedules: [],
        };
        subjectsMap.set(sc.subject_id, subject);
      }
      subject.schedules.push({
        id: sc.id,
        regularSchedId: sc.regular_sched_id,
        subjectId: sc.subject_id,
        subjectCode: sc.subject_code,
        descTitle: sc.descriptive_title,
        units: sc.units,
        mode: sc.mode,
        set: sc.set,
        schoolYear: sc.school_year,
        semester: sc.semester,
        program: sc.program,
        dayOfWeek: sc.day_of_week,
        startTime: sc.start_time,
        endTime: sc.end_time,
        room: sc.room,
        instructor: sc.instructor,
      });
    }
    return {
      studentAcademicId: s.student_academic_id,
      studentId: s.student_id,
      studentName: `${s.last_name}, ${s.first_name} ${s.mid_name ?? ""}`.trim(),
      assignedSubjects: [...subjectsMap.values()],
    };
  });
}

/** POST /regular_schedule/create-irregular-schedule — assigns regular schedule slot(s) to an irregular student's term. */
async function assign(input: {
  studentAcademicId: number;
  regularSchedIds: number[];
  syId: number;
  semesterNumber: number;
}): Promise<string> {
  const data = await apiPost<{ message?: string }>(
    `/regular_schedule/create-irregular-schedule${termScopeQuery(input.syId, input.semesterNumber)}`,
    {
      studentAcademicId: input.studentAcademicId,
      regularSchedIds: input.regularSchedIds,
    },
  );
  return apiMessage(data);
}

/** DELETE /irregular_schedule/<id> — hard delete (unassigns the schedule from the irregular student). */
async function removeIrregular(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/irregular_schedule/${id}`);
  return apiMessage(data);
}

/** PUT /irregular_schedule/:id — updates an existing irregular assignment. */
async function updateIrregular(id: number, payload: Record<string, unknown>): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/irregular_schedule/${id}`, payload);
  return apiMessage(data);
}

export const irregularClassService = {
  listStudents,
  listPendingStudents,
  listPendingSchedule,
  listAssignedSchedule,
  assign,
  removeIrregular,
  updateIrregular,
};
