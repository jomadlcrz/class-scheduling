import { ApiError, apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import { semesterService } from "~/services/semester.service";
import {
  DAY_LABELS,
  SCHEDULE_MODES,
  parseTime12h,
  type Day,
  type RegularScheduleDetail,
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
  sched_id: number;
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
  instructor_id: number;
  instructor_name: string;
  room_id: number | null;
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
      id: String(r.sched_id),
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
      facultyId: String(r.instructor_id),
      facultyName: r.instructor_name,
      roomId: r.room_id != null ? String(r.room_id) : "",
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
  yearLevel?: number;
  semester: ScheduleSemester;
}): Promise<ScheduleSubjectOption[]> {
  const query = new URLSearchParams({
    school_year: params.schoolYear,
    program_id: String(params.programId),
    semester: String(params.semester),
  });
  if (params.yearLevel != null) query.set("year_level", String(params.yearLevel));
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

/** One relocated saved session within a repack_instructor suggestion. */
export type RepackMove = {
  scheduleId: number;
  subjectCode: string;
  setName: string;
  from: { day: string; start: string; end: string; room: string };
  to: { day: string; start: string; end: string; room: string; room_id: number };
  apply: { method: string; path: string; body: Record<string, unknown> };
};

/** Where the previously-unplaceable subject lands once the repack's moves are applied. */
export type RepackPlacement = {
  day: string;
  start: string;
  end: string;
  room: string;
  roomId: number;
  isLab: boolean;
};

/** A saved session the repack has no legal home for afterwards — the trade-off cost. */
export type RepackDisplaced = {
  scheduleId: number;
  subjectCode: string;
  setLabel: string;
  day: string;
  /** Decimal hours (e.g. 9.5 = 9:30 AM), not a formatted time string. */
  start: number;
  end: number;
};

export type ScheduleSuggestion = {
  type: "subject_hour_override" | "move_existing_session" | "repack_instructor";
  subjectId?: number;
  subjectCode?: string;
  setId?: number;
  setName?: string;
  lectureHours?: number;
  labHours?: number;
  meetings?: number;
  totalWeeklyHours?: number;
  reason?: string;
  apply?: {
    method: string;
    path?: string;
    body?: Record<string, unknown>;
    /** present for repack_instructor — one apply spec per relocated session */
    moves?: { method: string; path: string; body: Record<string, unknown> }[];
  };
  /** present for move_existing_session */
  scheduleId?: number;
  instructorName?: string;
  from?: { day: string; start: string; end: string; room: string };
  to?: { day: string; start: string; end: string; room: string; room_id: number };
  enables?: { subject_code: string; at: string };
  /** present for repack_instructor */
  instructorId?: number;
  moves?: RepackMove[];
  placesAt?: RepackPlacement[];
  displaces?: RepackDisplaced[];
  netGain?: number;
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
  /** Machine-readable fix suggestions (subject hour overrides, session moves, etc.). */
  suggestions?: unknown[];
};

export type AutoGenerateResult = {
  slots: SlotDraft[];
  /** Subjects the algorithm couldn't fit anywhere, with the reason why. */
  conflicts: string[];
  /** Structured suggestions the UI can render as one-click fixes. */
  suggestions: ScheduleSuggestion[];
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
  withRebalance?: boolean;
}): Promise<AutoGenerateResult> {
  const endpoint = input.withRebalance
    ? "/regular_schedule/auto-generate-schedule/with-rebalance"
    : "/regular_schedule/auto-generate-schedule";
  const data = await apiPost<AutoGenerateResponse>(endpoint, {
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

  return {
    slots,
    conflicts: data.conflicts ?? [],
    suggestions: (data.suggestions ?? []).map((s) => {
      const r = s as Record<string, unknown>;
      return {
        ...r,
        scheduleId: r.schedule_id,
        subjectId: r.subject_id,
        subjectCode: r.subject_code,
        setId: r.set_id,
        setName: r.set_name,
        instructorId: r.instructor_id,
        instructorName: r.instructor_name,
        lectureHours: r.lecture_hours,
        labHours: r.lab_hours,
        totalWeeklyHours: r.total_weekly_hours,
        from: r.from as ScheduleSuggestion["from"],
        to: r.to as ScheduleSuggestion["to"],
        enables: r.enables as ScheduleSuggestion["enables"],
        moves: (r.moves as Record<string, unknown>[] | undefined)?.map((m) => ({
          scheduleId: m.schedule_id,
          subjectCode: m.subject_code,
          setName: m.set_name,
          from: m.from,
          to: m.to,
          apply: m.apply,
        })) as RepackMove[] | undefined,
        placesAt: (r.places_at as Record<string, unknown>[] | undefined)?.map((p) => ({
          day: p.day,
          start: p.start,
          end: p.end,
          room: p.room,
          roomId: p.room_id,
          isLab: p.is_lab,
        })) as RepackPlacement[] | undefined,
        displaces: (r.displaces as Record<string, unknown>[] | undefined)?.map((d) => ({
          scheduleId: d.schedule_id,
          subjectCode: d.subject_code,
          setLabel: d.set_label,
          day: d.day,
          start: d.start,
          end: d.end,
        })) as RepackDisplaced[] | undefined,
        netGain: r.net_gain,
      };
    }) as ScheduleSuggestion[],
  };
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
}): Promise<{ message?: string; warnings?: string[]; rescheduled?: string[] }> {
  const byDay = new Map<Day, RegularSlotInput[]>();
  for (const slot of input.slots) {
    const slots = byDay.get(slot.day) ?? [];
    byDay.set(slot.day, slots);
    slots.push(slot);
  }

  return apiPost<{ message?: string; warnings?: string[]; rescheduled?: string[] }>("/regular_schedule/create-regular-class-schedules", {
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

export type ScheduleYearLevelOption = { id: number; name: string };

type CreationContextResponse = {
  year_levels: { year_level_int: number; year_level_name: string }[];
  semesters: { semester_int: number; semester_name: string }[];
};

/**
 * GET /regular_schedule/create-regular-class-schedules — year levels & semesters
 * scoped to schedule creation. Only the year levels are safe to source from here:
 * the semesters this returns are just the 1st/2nd Semester label vocabulary, not
 * real Semester rows, and callers elsewhere on this page need the real `semId`
 * foreign key (from semesterService/useSemesters) to query sets.
 */
async function getCreationContext(): Promise<{ yearLevels: ScheduleYearLevelOption[] }> {
  const data = await apiGet<CreationContextResponse>(
    "/regular_schedule/create-regular-class-schedules",
  );
  return {
    yearLevels: data.year_levels.map((y) => ({ id: y.year_level_int, name: y.year_level_name })),
  };
}

export type ScheduleProgramOption = { id: number; abbrev: string; name: string };

type ScheduleProgramsResponse = {
  program_id: number;
  program_abbrev: string;
  program_name: string;
}[];

/**
 * GET /schedule/programs — lightweight program list scoped to schedule creation
 * (id/abbrev/name only, no department join). Not swapped in for programService.list()
 * on the New Schedule page: that page also needs each program's departmentCode for
 * the built schedule's display metadata, which this endpoint doesn't return.
 */
async function listPrograms(): Promise<ScheduleProgramOption[]> {
  const data = await apiGet<ScheduleProgramsResponse>("/schedule/programs");
  return data.map((p) => ({ id: p.program_id, abbrev: p.program_abbrev, name: p.program_name }));
}

type RegularScheduleResponse = {
  id: number;
  sy_id: number;
  semester: number;
  program_id: number;
  set_id: number;
  subject_id: number;
  subject_code: string;
  mode: string;
  instructor_id: number | null;
  room_id: number | null;
  room_name: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

/** GET /regular_schedule/<id> — a single saved regular-schedule slot. */
async function getRegular(id: number): Promise<RegularScheduleDetail> {
  const r = await apiGet<RegularScheduleResponse>(`/regular_schedule/${id}`);
  return {
    id: r.id,
    syId: r.sy_id,
    semester: r.semester,
    programId: r.program_id,
    setId: r.set_id,
    subjectId: r.subject_id,
    subjectCode: r.subject_code,
    mode: r.mode,
    instructorId: r.instructor_id,
    roomId: r.room_id,
    roomName: r.room_name,
    dayOfWeek: r.day_of_week,
    startTime: parseTime12h(r.start_time),
    endTime: parseTime12h(r.end_time),
  };
}

/** PUT /regular_schedule/<id>/reschedule — moves a saved session to a new day/time/room. 409 on conflict. */
async function updateRegularSlot(
  id: number,
  input: { dayOfWeek: string; startTime: string; endTime: string; roomId?: number | null },
): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/regular_schedule/${id}/reschedule`, input);
  return apiMessage(data);
}

/** PUT /regular_schedule/<id> — reassign room/instructor/subject/mode at the same slot (or move if day/time given). */
async function updateRegular(
  id: number,
  input: {
    subjectId?: number | null;
    dayOfWeek?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    mode?: string | null;
    instructorId?: number | null;
    roomId?: number | null;
  },
): Promise<string> {
  const payload: Record<string, unknown> = {};
  if (input.subjectId != null) payload.subjectId = input.subjectId;
  if (input.dayOfWeek != null) payload.dayOfWeek = input.dayOfWeek;
  if (input.startTime != null) payload.startTime = input.startTime;
  if (input.endTime != null) payload.endTime = input.endTime;
  if (input.mode != null) payload.mode = input.mode;
  if (input.instructorId != null) payload.instructorId = input.instructorId;
  if (input.roomId != null) payload.roomId = input.roomId;
  const data = await apiPut<{ message?: string }>(`/regular_schedule/${id}`, payload);
  return apiMessage(data);
}

/** DELETE /regular_schedule/<id> — hard delete. */
async function removeRegular(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/regular_schedule/${id}`);
  return apiMessage(data);
}

export type SubjectHourOverride = {
  id: number;
  subjectId: number;
  subjectCode: string | null;
  descriptiveTitle: string | null;
  setId: number | null;
  setName: string | null;
  scope: "set" | "all_sets";
  syId: number;
  semId: number;
  lectureHours: number;
  labHours: number;
  meetings: number;
  totalWeeklyHours: number;
  note: string | null;
};

type SubjectHourOverrideResponse = {
  id: number;
  subject_id: number;
  subject_code: string | null;
  descriptive_title: string | null;
  set_id: number | null;
  set_name: string | null;
  scope: string;
  sy_id: number;
  sem_id: number;
  lecture_hours: number;
  lab_hours: number;
  meetings: number;
  total_weekly_hours: number;
  note: string | null;
};

/** GET /schedule/subject-hour-overrides?syId=&semId=[&setId=] — per-subject hour overrides for a term. */
async function listSubjectHourOverrides(params: {
  syId: number;
  semId: number;
  setId?: number;
}): Promise<SubjectHourOverride[]> {
  const query = new URLSearchParams({ syId: String(params.syId), semId: String(params.semId) });
  if (params.setId != null) query.set("setId", String(params.setId));
  const data = await apiGet<SubjectHourOverrideResponse[]>(`/schedule/subject-hour-overrides?${query}`);
  return data.map((r) => ({
    id: r.id,
    subjectId: r.subject_id,
    subjectCode: r.subject_code,
    descriptiveTitle: r.descriptive_title,
    setId: r.set_id,
    setName: r.set_name,
    scope: r.scope as "set" | "all_sets",
    syId: r.sy_id,
    semId: r.sem_id,
    lectureHours: Number(r.lecture_hours),
    labHours: Number(r.lab_hours),
    meetings: r.meetings,
    totalWeeklyHours: Number(r.total_weekly_hours),
    note: r.note,
  }));
}

/** POST /schedule/subject-hour-overrides — create or update a per-subject hour override. */
async function upsertSubjectHourOverride(input: {
  subjectId: number;
  syId: number;
  semId: number;
  setId?: number | null;
  lectureHours: number;
  labHours: number;
  meetings: number;
  note?: string;
}): Promise<{ id: number; created: boolean }> {
  const data = await apiPost<{ id: number; created: boolean }>("/schedule/subject-hour-overrides", {
    subjectId: input.subjectId,
    syId: input.syId,
    semId: input.semId,
    setId: input.setId,
    lectureHours: input.lectureHours,
    labHours: input.labHours,
    meetings: input.meetings,
    note: input.note,
  });
  return data;
}

/** DELETE /schedule/subject-hour-overrides/<id> — remove an override (reverts to subject type default). */
async function deleteSubjectHourOverride(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/schedule/subject-hour-overrides/${id}`);
  return apiMessage(data);
}

export const scheduleService = {
  view,
  listScheduleSubjects,
  listScheduleRooms,
  autoGenerate,
  createRegular,
  getSubjectTypeOptions,
  getCreationContext,
  listPrograms,
  getRegular,
  updateRegular,
  updateRegularSlot,
  removeRegular,
  listSubjectHourOverrides,
  upsertSubjectHourOverride,
  deleteSubjectHourOverride,
};
