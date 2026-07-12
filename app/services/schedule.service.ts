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
import { YEAR_LEVEL_LABELS, type YearLevel } from "~/types/subject";

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
  faculty_name: string;
  room_name: string | null;
};

/** GET /schedule/view — role-scoped list of saved schedules. */
async function view(): Promise<Schedule[]> {
  let data: ViewScheduleResponse[];
  try {
    data = await apiGet<ViewScheduleResponse[]>("/schedule/view");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  const semesters = await semesterService.list();
  const semByName = new Map(semesters.map((s) => [s.semester, s.semesterNumber]));

  return data.map((r, index) => {
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
      setId: r.set_name ?? "",
      setCode: r.set_name ?? "",
      program: programAbbrev ?? r.dept_abbrev ?? "",
      yearLevel: ([1, 2, 3, 4].includes(yearLevel) ? yearLevel : 1) as YearLevel,
      facultyId: "",
      facultyName: r.faculty_name,
      roomId: "",
      roomName: r.room_name ?? "",
      buildingCode: "",
      mode: normalizeMode(r.mode),
      day: DAY_BY_LABEL[r.day_of_week] ?? "M",
      startTime: parseTime12h(start),
      endTime: parseTime12h(end ?? start),
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
    faculties: {
      faculty_id: number;
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
    faculties: (s.faculties ?? []).map((f) => ({
      id: f.faculty_id,
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
      faculty_id: number | null;
      faculty_name: string | null;
      room_id: number | null;
      room_name: string | null;
      faculty_choices: { faculty_id: number; faculty_name: string }[];
      room_choices: { room_id: number; room_name: string }[];
      start_time: string;
      end_time: string;
    }[];
  }[];
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
  programId: number;
  setId: number;
}): Promise<SlotDraft[]> {
  const data = await apiPost<AutoGenerateResponse>("/regular_schedule/auto-generate-schedule", {
    schoolYear: input.schoolYear,
    semester: input.semesterLabel,
    yearLevel: YEAR_LEVEL_LABELS[input.yearLevel],
    programId: input.programId,
    setId: input.setId,
  });

  return data.day_schedules.flatMap((day) =>
    day.subject_schedules.map((s) => ({
      subjectId: s.subject_id,
      subjectCode: s.subject_code,
      subjectTitle: s.subject_name,
      day: DAY_BY_LABEL[day.day_of_week] ?? ("M" as Day),
      startTime: parseTime12h(s.start_time),
      endTime: parseTime12h(s.end_time),
      facultyId: s.faculty_id,
      facultyName: s.faculty_name ?? "",
      roomId: s.room_id,
      roomName: s.room_name ?? "",
      mode: normalizeMode(s.mode),
      sessionType: s.session_type,
    })),
  );
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
}): Promise<void> {
  const byDay = new Map<Day, RegularSlotInput[]>();
  for (const slot of input.slots) {
    const slots = byDay.get(slot.day) ?? [];
    byDay.set(slot.day, slots);
    slots.push(slot);
  }

  await apiPost("/regular_schedule/create-regular-class-schedules", {
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
        facultyId: s.facultyId,
        facultyName: s.facultyName,
        roomId: s.roomId,
      })),
    })),
  });
}

export const scheduleService = {
  view,
  listScheduleSubjects,
  listScheduleRooms,
  autoGenerate,
  createRegular,
};
