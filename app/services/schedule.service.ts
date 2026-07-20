import { ApiError, apiGet, apiPost } from "~/lib/api";
import { semesterService } from "~/services/semester.service";
import {
  DAY_LABELS,
  SCHEDULE_MODES,
  parseTime12h,
  type Day,
  type Schedule,
  type ScheduleMode,
  type ScheduleSemester,
} from "~/types/schedule";
import { type YearLevel } from "~/types/subject";

/** Regular class schedules (registrar_admin schedules module). */

const DAY_BY_LABEL = Object.fromEntries(
  (Object.entries(DAY_LABELS) as [Day, string][]).map(([short, label]) => [label, short]),
) as Record<string, Day>;

/** The backend title-cases modes on save ("F2F" is stored as "F2f"). */
function normalizeMode(mode: string): ScheduleMode {
  return SCHEDULE_MODES.find((m) => m.toLowerCase() === mode.toLowerCase()) ?? "F2F";
}

type ViewScheduleResponse = {
  school_year: string;
  semester: string;
  subject_type: string;
  subject_code: string;
  desc_title: string;
  units: number;
  set_name: string;
  day_of_week: string;
  mode: string;
  class_time: string;
  class_duration: string;
  dept_abbrev: string | null;
  instructor_name: string;
  room_name: string | null;
  /** Only present when the viewer is a STUDENT (StudentAcademic.enrolled_status). */
  academic_status?: string;
};

/**
 * GET /schedule/view — role-scoped list of saved schedules. The backend
 * already filters rows by the caller's JWT: DEAN → their department,
 * INSTRUCTOR → schedules where they're the assigned faculty, STUDENT →
 * schedules for the set they're enrolled in, REGISTRAR_ADMIN → everything.
 * Callers don't need to (and can't, since faculty_id/subject_id aren't
 * returned) filter by identity client-side — only by school year/semester.
 */
async function view(): Promise<Schedule[]> {
  let data: { schedules: ViewScheduleResponse[] };
  try {
    data = await apiGet<{ schedules: ViewScheduleResponse[] }>("/schedule/view");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  const schedules = data.schedules ?? [];
  const semesters = await semesterService.list();
  const semByName = new Map(semesters.map((s) => [s.semester, s.semesterNumber]));

  return schedules.map((r, index) => {
    const [start, end] = r.class_time.split(" - ");
    // set_name is "{PROGRAM}-{year}{SET}", e.g. "BSIT-1A".
    const [programAbbrev, yearAndSet] = r.set_name?.split("-") ?? [];
    const yearLevel = Number(yearAndSet?.charAt(0));
    return {
      id: String(index),
      schoolYear: r.school_year,
      semester: (semByName.get(r.semester) ?? 1) as ScheduleSemester,
      subjectId: "",
      subjectCode: r.subject_code,
      subjectTitle: r.desc_title,
      units: r.units,
      setId: r.set_name ?? "",
      setCode: r.set_name ?? "",
      program: programAbbrev ?? r.dept_abbrev ?? "",
      departmentCode: r.dept_abbrev ?? "",
      yearLevel: ([1, 2, 3, 4].includes(yearLevel) ? yearLevel : 1) as YearLevel,
      facultyId: "",
      facultyName: r.instructor_name,
      roomId: "",
      roomName: r.room_name ?? "",
      mode: normalizeMode(r.mode),
      day: DAY_BY_LABEL[r.day_of_week] ?? "M",
      startTime: parseTime12h(start),
      endTime: parseTime12h(end ?? start),
      academicStatus: r.academic_status,
    };
  });
}

export type ScheduleFacultyOption = {
  id: number;
  fullName: string;
  maxWeeklyHours: number | null;
  currentWeeklyHours: number | null;
};

export type ScheduleSubjectOption = {
  id: number;
  code: string;
  title: string;
  subjectType: string;
  faculties: ScheduleFacultyOption[];
};

type ScheduleSubjectsResponse = {
  subjects: {
    subject_id: number;
    subject_code: string;
    descriptive_title: string;
    subject_type: string;
    instructors: {
      instructor_id: number;
      full_name: string;
      max_weekly_hours: number | string | null;
      current_weekly_hours: number | string | null;
    }[];
  }[];
};

/** GET /schedule/subjects — curriculum subjects with their assigned faculties for a term. */
async function listScheduleSubjects(params: {
  schoolYear: string;
  programId: number;
  yearLevel: number;
  semester: ScheduleSemester;
}): Promise<ScheduleSubjectOption[]> {
  const query = new URLSearchParams({
    school_year: params.schoolYear,
    program_id: String(params.programId),
    year_level: String(params.yearLevel),
    semester: String(params.semester),
  });
  const data = await apiGet<ScheduleSubjectsResponse | []>(`/schedule/subjects?${query}`);
  if (Array.isArray(data)) return [];
  return data.subjects.map((s) => ({
    id: s.subject_id,
    code: s.subject_code,
    title: s.descriptive_title,
    subjectType: s.subject_type,
    faculties: (s.instructors ?? []).map((f) => ({
      id: f.instructor_id,
      fullName: f.full_name,
      maxWeeklyHours: f.max_weekly_hours === null ? null : Number(f.max_weekly_hours),
      currentWeeklyHours: f.current_weekly_hours === null ? null : Number(f.current_weekly_hours),
    })),
  }));
}

export type ScheduleRoomOption = {
  id: number;
  buildingName: string;
  floorLevel: number;
  roomName: string;
  roomCapacity: number;
};

type ScheduleRoomsResponse = {
  room_id: number;
  building_name: string;
  floor_level: number;
  room_name: string;
  room_capacity: number;
}[];

/** GET /schedule/rooms — schedulable rooms (office rooms excluded). 404 → empty. */
async function listScheduleRooms(): Promise<ScheduleRoomOption[]> {
  let data: ScheduleRoomsResponse;
  try {
    data = await apiGet<ScheduleRoomsResponse>("/schedule/rooms");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  // Rows repeat per existing schedule join — dedupe by room id.
  const rooms = new Map<number, ScheduleRoomOption>();
  for (const r of data) {
    if (!rooms.has(r.room_id)) {
      rooms.set(r.room_id, {
        id: r.room_id,
        buildingName: r.building_name,
        floorLevel: r.floor_level,
        roomName: r.room_name,
        roomCapacity: r.room_capacity,
      });
    }
  }
  return [...rooms.values()];
}

/** One builder slot — faculty/room may be unassigned on auto-generated slots. */
export type SlotDraft = {
  subjectId: number;
  subjectCode: string;
  subjectTitle: string;
  day: Day;
  startTime: string;
  endTime: string;
  facultyId: number | null;
  facultyName: string;
  roomId: number | null;
  roomName: string;
  mode: ScheduleMode;
  sessionType?: "Lecture" | "Lab";
  /**
   * Other instructors the auto-generate algorithm considered viable for this exact
   * slot (may include faculty from other programs' curricula that /schedule/subjects
   * doesn't surface for this program). Lets the Edit form always offer the faculty
   * that was actually assigned, even when it isn't in the subject's usual faculty list.
   */
  facultyChoices?: { id: number; fullName: string }[];
  /** Rooms of the correct type (lecture/lab) the algorithm considered viable for this slot. */
  roomChoices?: { id: number; roomName: string }[];
};

type AutoGenerateResponse = {
  school_year: string;
  semester: string;
  program_id: number;
  set_id: number;
  day_schedules: {
    day_of_week: string;
    subject_schedules: {
      subject_id: number;
      subject_code: string;
      subject_name: string;
      duration: number;
      session_type: "Lecture" | "Lab";
      mode: string;
      instructor_id: number | null;
      instructor_name: string | null;
      room_id: number | null;
      room_name: string | null;
      instructor_choices: { instructor_id: number; instructor_name: string }[];
      room_choices: { room_id: number; room_name: string }[];
      start_time: string;
      end_time: string;
    }[];
  }[];
  /** Human-readable reasons for subjects the algorithm couldn't place at all. */
  conflicts: string[];
};

export type AutoGenerateResult = {
  slots: SlotDraft[];
  /** Subjects the algorithm couldn't fit anywhere, with the reason why. */
  conflicts: string[];
};

/**
 * POST /regular_schedule/auto-generate-schedule — returns a PROPOSAL (nothing
 * is saved). Lab sessions are pinned to the lab time slots configured in
 * Weekly Hour Allocations; faculty/room come back null when no assignment fits.
 */
async function autoGenerate(input: {
  schoolYear: string;
  semester: ScheduleSemester;
  semesterLabel: string;
  yearLevel: YearLevel;
  yearLevelLabel: string;
  programId: number;
  setId: number;
}): Promise<AutoGenerateResult> {
  const data = await apiPost<AutoGenerateResponse>("/regular_schedule/auto-generate-schedule", {
    schoolYear: input.schoolYear,
    semester: input.semesterLabel,
    yearLevel: input.yearLevelLabel,
    programId: input.programId,
    setId: input.setId,
  });

  const slots = data.day_schedules.flatMap((day) =>
    day.subject_schedules.map((s) => ({
      subjectId: s.subject_id,
      subjectCode: s.subject_code,
      subjectTitle: s.subject_name,
      day: DAY_BY_LABEL[day.day_of_week] ?? ("M" as Day),
      startTime: parseTime12h(s.start_time),
      endTime: parseTime12h(s.end_time),
      facultyId: s.instructor_id,
      facultyName: s.instructor_name ?? "",
      roomId: s.room_id,
      roomName: s.room_name ?? "",
      facultyChoices: (s.instructor_choices ?? []).map((f) => ({
        id: f.instructor_id,
        fullName: f.instructor_name,
      })),
      roomChoices: (s.room_choices ?? []).map((r) => ({
        id: r.room_id,
        roomName: r.room_name,
      })),
      mode: normalizeMode(s.mode),
      sessionType: s.session_type,
    })),
  );

  return { slots, conflicts: data.conflicts ?? [] };
}

export type RegularSlotInput = {
  day: Day;
  /** "HH:MM" 24h — accepted by the backend alongside "h:MM AM/PM". */
  startTime: string;
  endTime: string;
  subjectId: number;
  mode: string;
  facultyId: number;
  facultyName: string;
  roomId: number | null;
};

/** POST /regular_schedule/create-regular-class-schedules — saves the whole week. */
async function createRegular(input: {
  schoolYear: string;
  semester: ScheduleSemester;
  programId: number;
  setId: number;
  slots: RegularSlotInput[];
}): Promise<{ message?: string; warnings?: string[] }> {
  const byDay = new Map<Day, RegularSlotInput[]>();
  for (const slot of input.slots) {
    const slots = byDay.get(slot.day) ?? [];
    byDay.set(slot.day, slots);
    slots.push(slot);
  }

  return apiPost<{ message?: string; warnings?: string[] }>("/regular_schedule/create-regular-class-schedules", {
    schoolYear: input.schoolYear,
    semester: input.semester,
    programId: input.programId,
    setId: input.setId,
    daySchedules: [...byDay.entries()].map(([day, slots]) => ({
      dayOfWeek: DAY_LABELS[day],
      subjectSchedules: slots.map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        subjectId: s.subjectId,
        mode: s.mode,
        instructorId: s.facultyId,
        instructorName: s.facultyName,
        roomId: s.roomId,
      })),
    })),
  });
}

/** GET /schedule/get-set-with-schedules — ids of sets that already have a saved regular schedule. 404 → empty. */
async function getSetsWithSchedules(): Promise<Set<number>> {
  let data: { sets: { set_id: number }[] };
  try {
    data = await apiGet<{ sets: { set_id: number }[] }>("/schedule/get-set-with-schedules");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return new Set();
    throw err;
  }
  return new Set(data.sets.map((s) => s.set_id));
}

/**
 * GET /schedule/subject-type-options — subject-type vocabulary scoped to the
 * schedule module. Same values as enumService.getOptions().subjectType, kept
 * as a separate call for consumers that specifically need the schedule-scoped
 * (registrar:subject-hours:read) endpoint rather than the general enums one.
 */
async function getSubjectTypeOptions(): Promise<string[]> {
  const data = await apiGet<{ subject_types: string }[]>("/schedule/subject-type-options");
  return data.map((d) => d.subject_types);
}

export const scheduleService = {
  view,
  listScheduleSubjects,
  listScheduleRooms,
  autoGenerate,
  createRegular,
  getSetsWithSchedules,
  getSubjectTypeOptions,
};
