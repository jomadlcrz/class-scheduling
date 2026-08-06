import { ApiError, apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
import { appendTermScopeParams, termScopeQuery } from "~/lib/term-scope";
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

  return schedules.map((r) => {
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
  /**
   * True when tier 3 (validated last resort) placed this session after a daily-hour-cap
   * confirm. Informational only — save auto-bumps the weekday cap regardless of this flag.
   */
  validatedLastResortDailyExempt?: boolean;
};

/** One relocated saved session within a repack_instructor suggestion. */
type RepackMove = {
  scheduleId: number;
  subjectCode: string;
  setName: string;
  from: { day: string; start: string; end: string; room: string };
  to: { day: string; start: string; end: string; room: string; room_id: number };
  apply: { method: string; path: string; body: Record<string, unknown> };
};

/**
 * Where the previously-unplaceable subject lands once the repack's moves are applied
 * (or, for `merge_places_at`, the ready-to-save slot itself — these rows already carry
 * every field `createRegular` needs, since there is nothing left to resolve).
 */
type RepackPlacement = {
  day: string;
  start: string;
  end: string;
  room: string;
  roomId: number;
  isLab: boolean;
  subjectId: number;
  subjectCode: string;
  instructorId: number;
  instructorName: string;
  mode: string;
  sessionType: "Lecture" | "Lab";
  /** Present when this slot was placed after a daily-hour-cap confirm (validated last resort). */
  validatedLastResortDailyExempt?: boolean;
};

/** A saved session the repack has no legal home for afterwards — the trade-off cost. */
type RepackDisplaced = {
  scheduleId: number;
  subjectCode: string;
  setLabel: string;
  day: string;
  /** Decimal hours (e.g. 9.5 = 9:30 AM), not a formatted time string. */
  start: number;
  end: number;
};

/** One weekday cap raise a `confirm_daily_hour_increase` suggestion would apply. */
type DailyLimitIncrease = {
  instructorId: number;
  instructorName: string;
  day: string;
  fromHours: number;
  toHours: number;
  projectedScheduledHours: number;
  currentScheduledHours: number;
  withinSchoolDay: boolean;
  schoolDayWindow: string;
};

export type ScheduleSuggestion = {
  type: "subject_hour_override" | "move_existing_session" | "repack_instructor";
  /** Only present for repack_instructor — which of the four repack flows this is. */
  strategy?: "merge_places_at" | "repack_instructor" | "move_session_chain" | "confirm_daily_hour_increase";
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
  /** present for strategy === "confirm_daily_hour_increase" */
  requiresConfirmation?: boolean;
  /** "instructorId:DayName" keys — send merged into confirmedDailyHourIncreases on regenerate. */
  confirmKeys?: string[];
  dailyLimitIncreases?: DailyLimitIncrease[];
  /** Backend-provided button copy, e.g. "Confirm John Vianney Manuel daily limit increase (Monday (10→11))". */
  buttonLabel?: string;
};

export type AutoGenerateResolution = {
  passes: number;
  sessionsMoved: number;
  moves: unknown[];
  movesRefused: unknown[];
  unresolved: string[];
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
      /** Note: backend sends this one field camelCase even though the rest of the row is snake_case. */
      validatedLastResortDailyExempt?: boolean;
    }[];
  }[];
  /** Human-readable reasons for subjects the algorithm couldn't place at all. */
  conflicts: string[];
  /** Machine-readable fix suggestions (subject hour overrides, session moves, etc.). */
  suggestions?: unknown[];
  resolution?: {
    passes: number;
    sessions_moved: number;
    moves: unknown[];
    moves_refused: unknown[];
    unresolved: string[];
  };
};

type AutoGenerateResult = {
  slots: SlotDraft[];
  /** Subjects the algorithm couldn't fit anywhere, with the reason why. */
  conflicts: string[];
  /** Structured suggestions the UI can render as one-click fixes. */
  suggestions: ScheduleSuggestion[];
  /** Present only when the write-enabled conflict resolver was requested. */
  resolution: AutoGenerateResolution | null;
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
  strategy?: "default" | "greedy" | "resolve";
  /**
   * "instructorId:DayName" keys the registrar has accepted from a
   * confirm_daily_hour_increase suggestion. Omitted entirely when empty —
   * the backend treats it as optional and this keeps the first generate minimal.
   */
  confirmedDailyHourIncreases?: string[];
}): Promise<AutoGenerateResult> {
  const endpoint =
    input.strategy === "resolve"
      ? "/regular_schedule/auto-generate-schedule/resolve"
      : input.strategy === "greedy"
        ? "/regular_schedule/auto-generate-schedule/greedy"
        : input.withRebalance
          ? "/regular_schedule/auto-generate-schedule/with-rebalance"
          : "/regular_schedule/auto-generate-schedule";
  const data = await apiPost<AutoGenerateResponse>(endpoint, {
    schoolYear: input.schoolYear,
    semester: input.semesterLabel,
    yearLevel: input.yearLevelLabel,
    programId: input.programId,
    setId: input.setId,
    ...(input.confirmedDailyHourIncreases?.length
      ? { confirmedDailyHourIncreases: input.confirmedDailyHourIncreases }
      : {}),
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
      validatedLastResortDailyExempt: s.validatedLastResortDailyExempt,
    })),
  );

  return {
    slots,
    conflicts: data.conflicts ?? [],
    resolution: data.resolution
      ? {
          passes: data.resolution.passes,
          sessionsMoved: data.resolution.sessions_moved,
          moves: data.resolution.moves ?? [],
          movesRefused: data.resolution.moves_refused ?? [],
          unresolved: data.resolution.unresolved ?? [],
        }
      : null,
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
          subjectId: p.subject_id,
          subjectCode: p.subject_code,
          instructorId: p.instructor_id,
          instructorName: p.instructor_name,
          mode: p.mode,
          sessionType: p.session_type,
          validatedLastResortDailyExempt: p.validatedLastResortDailyExempt as boolean | undefined,
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
        requiresConfirmation: r.requires_confirmation,
        confirmKeys: r.confirm_keys as string[] | undefined,
        dailyLimitIncreases: (r.daily_limit_increases as Record<string, unknown>[] | undefined)?.map((d) => ({
          instructorId: d.instructor_id,
          instructorName: d.instructor_name,
          day: d.day,
          fromHours: d.from_hours,
          toHours: d.to_hours,
          projectedScheduledHours: d.projected_scheduled_hours,
          currentScheduledHours: d.current_scheduled_hours,
          withinSchoolDay: d.within_school_day,
          schoolDayWindow: d.school_day_window,
        })) as ScheduleSuggestion["dailyLimitIncreases"],
        buttonLabel: r.button_label,
      };
    }) as ScheduleSuggestion[],
  };
}

type RegularSlotInput = {
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
 * real Semester rows; term-scoped APIs use `semesterNumber`.
 */
async function getCreationContext(): Promise<{ yearLevels: ScheduleYearLevelOption[] }> {
  const data = await apiGet<CreationContextResponse>(
    "/regular_schedule/create-regular-class-schedules",
  );
  return {
    yearLevels: data.year_levels.map((y) => ({ id: y.year_level_int, name: y.year_level_name })),
  };
}

type ScheduleProgramOption = { id: number; abbrev: string; name: string };

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

export type SubjectHourOverride = {
  id: number;
  subjectId: number;
  subjectCode: string | null;
  descriptiveTitle: string | null;
  setId: number | null;
  setName: string | null;
  scope: "set" | "all_sets";
  syId: number;
  semesterNumber: number;
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
  semester_number: number;
  lecture_hours: number;
  lab_hours: number;
  meetings: number;
  total_weekly_hours: number;
  note: string | null;
};

/** GET /schedule/subject-hour-overrides?sy_id=&semester_number=[&setId=] — per-subject hour overrides for a term. */
async function listSubjectHourOverrides(params: {
  syId: number;
  semesterNumber: number;
  setId?: number;
}): Promise<SubjectHourOverride[]> {
  const query = appendTermScopeParams(new URLSearchParams(), params.syId, params.semesterNumber);
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
    semesterNumber: r.semester_number,
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
  semesterNumber: number;
  setId?: number | null;
  lectureHours: number;
  labHours: number;
  meetings: number;
  note?: string;
}): Promise<{ id: number; created: boolean }> {
  const data = await apiPost<{ id: number; created: boolean }>("/schedule/subject-hour-overrides", {
    subjectId: input.subjectId,
    syId: input.syId,
    semesterNumber: input.semesterNumber,
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

/** Advanced scheduler endpoints retained for operator tools and conflict-resolution UIs. */
async function resolveGeneratedSchedule(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiPost<Record<string, unknown>>("/regular_schedule/auto-generate-schedule/resolve", payload);
}

async function generateGreedySchedule(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiPost<Record<string, unknown>>("/regular_schedule/auto-generate-schedule/greedy", payload);
}

export type UnseatedIrregularStudent = {
  studentProfileId: number;
  studentId: string | null;
  name: string;
};

export type RemoveSetSchedulesResult = {
  message: string;
  irregularStudentsUnseated: UnseatedIrregularStudent[];
};

async function removeSetSchedules(
  setId: number,
  syId: number,
  semesterNumber: number,
): Promise<RemoveSetSchedulesResult> {
  const query = new URLSearchParams({
    syId: String(syId),
    semester_number: String(semesterNumber),
  });
  const data = await apiDelete<{
    message?: string;
    irregular_students_unseated?: {
      student_profile_id: number;
      student_id: string | null;
      name: string;
    }[];
  }>(`/regular_schedule/set/${setId}?${query}`);
  return {
    message: apiMessage(data),
    irregularStudentsUnseated: (data.irregular_students_unseated ?? []).map((student) => ({
      studentProfileId: student.student_profile_id,
      studentId: student.student_id,
      name: student.name,
    })),
  };
}

export type ScheduledSetOption = {
  setId: number;
  setCode: string;
  yearLevel: string | number;
  schoolYear: string;
  programId: number;
  program: string;
  semesterNumber: number;
};

async function getSetWithSchedules(): Promise<ScheduledSetOption[]> {
  const data = await apiGet<{
    sets: {
      set_id: number;
      set_code: string;
      year_level: string | number;
      school_year: string;
      program_id: number;
      program: string;
      semester_number: number;
    }[];
  }>("/schedule/get-set-with-schedules");
  return data.sets.map((row) => ({
    setId: row.set_id,
    setCode: row.set_code,
    yearLevel: row.year_level,
    schoolYear: row.school_year,
    programId: row.program_id,
    program: row.program,
    semesterNumber: row.semester_number,
  }));
}

type InstructorLedgerReconciliation = {
  message: string;
  checked: number;
  drift: {
    instructor_id?: number;
    instructor_name?: string | null;
    set_id?: number;
    subject_id?: number;
    scope: string;
    ledger: number | null;
    actual: number;
    ledger_days?: number | null;
    actual_days?: number;
  }[];
  repaired: boolean;
};

async function reconcileInstructorLedgers(
  params: { syId: number; semesterNumber: number },
  apply = false,
): Promise<InstructorLedgerReconciliation> {
  const payload = {
    syId: params.syId,
    semesterNumber: params.semesterNumber,
  };
  if (apply) {
    return apiPost<InstructorLedgerReconciliation>(
      "/regular_schedule/instructor-ledgers/reconcile",
      payload,
    );
  }
  const query = appendTermScopeParams(new URLSearchParams(), params.syId, params.semesterNumber);
  return apiGet<InstructorLedgerReconciliation>(
    `/regular_schedule/instructor-ledgers/reconcile?${query}`,
  );
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
  listSubjectHourOverrides,
  upsertSubjectHourOverride,
  deleteSubjectHourOverride,
  resolveGeneratedSchedule,
  generateGreedySchedule,
  removeSetSchedules,
  getSetWithSchedules,
  reconcileInstructorLedgers,
};
