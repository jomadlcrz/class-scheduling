import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import { getDayMapping } from "~/lib/day-utils";
import { appendTermScopeParams } from "~/lib/term-scope";
import { semesterService } from "~/services/semester.service";
import {
  parseTime12h,
  type Attestation,
  type Day,
  type FinalizedMajorMeeting,
  type Schedule,
  type ScheduleMode,
  type ScheduleSemester,
  type ClassModePolicy,
} from "~/types/schedule";
export type { ClassModePolicy } from "~/types/schedule";
import { type YearLevel } from "~/types/subject";

/** Regular class schedules (registrar_admin schedules module). */

function normalizeMode(mode: string): ScheduleMode {
  return mode as ScheduleMode;
}

type ViewScheduleResponse = {
  sched_id: number;
  school_year: string;
  semester: string;
  subject_code: string;
  desc_title: string;
  subject_type: string | null;
  units: number;
  set_name: string | null;
  program_name: string | null;
  dept_abbrev: string | null;
  instructor_id: number;
  instructor_name: string;
  room_id: number | null;
  room_name: string | null;
  room_capacity?: number | null;
  student_count?: number | null;
  class_mode: string | null;
  mode?: string | null;
  session_mode?: "LEC" | "LAB";
  day_of_week: string;
  class_time: string;
  academic_status?: "regular" | "irregular";
};

/**
 * GET /schedules — role-scoped list of saved schedules. The backend
 * already filters rows by the caller's JWT: DEAN → their department,
 * INSTRUCTOR → schedules where they're the assigned faculty, STUDENT →
 * schedules for the set they're enrolled in, REGISTRAR_ADMIN → everything.
 * Callers don't need to (and can't, since faculty_id/subject_id aren't
 * returned) filter by identity client-side — only by school year/semester.
 */
async function view(): Promise<Schedule[]> {
  let data: { schedules: ViewScheduleResponse[] };
  try {
    data = await apiGet<{ schedules: ViewScheduleResponse[] }>("/schedules");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  const schedules = data.schedules ?? [];
  const [semesters, dayMap] = await Promise.all([semesterService.list(), getDayMapping()]);
  const semByName = new Map(semesters.map((s) => [s.semester, s.semesterNumber]));
  const nameToCode = dayMap?.nameToCode ?? {};

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
      subjectType: r.subject_type ?? "",
      units: r.units,
      setId: r.set_name ?? "",
      setCode: r.set_name ?? "",
      program: programAbbrev ?? r.dept_abbrev ?? "",
      programName: r.program_name ?? undefined,
      departmentCode: r.dept_abbrev ?? "",
      yearLevel: ([1, 2, 3, 4].includes(yearLevel) ? yearLevel : 1) as YearLevel,
      facultyId: String(r.instructor_id),
      facultyName: r.instructor_name,
      roomId: r.room_id != null ? String(r.room_id) : "",
      roomName: r.room_name ?? "",
      studentCount: r.student_count ?? null,
      roomCapacity: r.room_capacity ?? null,
      // The scheduling API renamed this from `mode` to `class_mode`.  Reading
      // both keeps schedules visible during a staggered frontend/backend deploy.
      mode: normalizeMode(r.class_mode ?? r.mode ?? ""),
      sessionMode: r.session_mode,
      day: nameToCode[r.day_of_week] ?? "M",
      startTime: parseTime12h(start),
      endTime: parseTime12h(end ?? start),
      academicStatus: r.academic_status,
    };
  });
}

type AttestationResponse = {
  setCode: string;
  schoolYear: string;
  semesterNumber: number;
  preparedBy: { name: string; position: string };
  approvedBy: { name: string; position: string; departmentAbbrev?: string };
};

/** GET /schedules — returns only the attestations array (student/instructor roles). */
async function viewAttestations(): Promise<Attestation[]> {
  let data: { attestations?: AttestationResponse[] };
  try {
    data = await apiGet<{ attestations?: AttestationResponse[] }>("/schedules");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return (data.attestations ?? []).map((a) => ({
    setCode: a.setCode,
    schoolYear: a.schoolYear,
    semesterNumber: a.semesterNumber,
    preparedBy: { name: a.preparedBy.name, position: a.preparedBy.position },
    approvedBy: {
      name: a.approvedBy.name,
      position: a.approvedBy.position,
      departmentAbbrev: a.approvedBy.departmentAbbrev,
    },
  }));
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
  offerings?: {
    programId: number;
    programAbbrev: string;
    setId: number;
    setName: string;
    yearLevel: number;
  }[];
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
    offerings?: {
      program_id: number;
      program_abbrev: string;
      set_id: number;
      set_name: string;
      year_level: number;
    }[];
  }[];
};

/** GET /schedule/subjects — curriculum subjects with their assigned faculties for a term. */
async function listScheduleSubjects(params: {
  schoolYear: string;
  programId?: number;
  yearLevel?: number;
  semester: ScheduleSemester;
  /** Include subjects from already-scheduled sets (backend `include_scheduled_sets`) — used when
   *  deep-linking the generator to a section that may already have a saved timetable. */
  includeScheduledSets?: boolean;
}): Promise<ScheduleSubjectOption[]> {
  const query = new URLSearchParams({
    school_year: params.schoolYear,
    semester_number: String(params.semester),
  });
  if (params.programId != null) query.set("program_id", String(params.programId));
  if (params.yearLevel != null) query.set("year_level", String(params.yearLevel));
  if (params.includeScheduledSets) query.set("include_scheduled_sets", "true");
  const data = await apiGet<ScheduleSubjectsResponse | []>(`/scheduling/options/subjects?${query}`);
  if (Array.isArray(data)) return [];
  return data.subjects.map((s) => ({
    id: s.subject_id,
    code: s.subject_code,
    title: s.descriptive_title,
    subjectType: s.subject_type,
    offerings: (s.offerings ?? []).map((offering) => ({
      programId: offering.program_id,
      programAbbrev: offering.program_abbrev,
      setId: offering.set_id,
      setName: offering.set_name,
      yearLevel: offering.year_level,
    })),
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

/** GET /scheduling/options/rooms — schedulable rooms (office rooms excluded). 404 → empty. */
async function listScheduleRooms(): Promise<ScheduleRoomOption[]> {
  let data: ScheduleRoomsResponse;
  try {
    data = await apiGet<ScheduleRoomsResponse>("/scheduling/options/rooms");
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
  /** Backend SessionMode value returned by GET /enums (for example, LEC or LAB). */
  sessionMode?: string;
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

/** One relocated saved session within a rearrange_instructor_week suggestion. */
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
  sessionMode: string;
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
  type: "change_subject_hours" | "move_session" | "rearrange_instructor_week";
  /** Identifies the backend's rearrange_instructor_week strategy. */
  strategy?: "merge_places_at" | "rearrange_instructor_week" | "move_session_chain" | "confirm_daily_hour_increase";
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
    /** One apply specification per relocated session. */
    moves?: { method: string; path: string; body: Record<string, unknown> }[];
  };
  /** present for move_existing_session */
  scheduleId?: number;
  instructorName?: string;
  from?: { day: string; start: string; end: string; room: string };
  to?: { day: string; start: string; end: string; room: string; room_id: number };
  enables?: { subject_code: string; at: string };
  /** Present for rearrange_instructor_week suggestions. */
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

/** One already-saved session a skipped plan would have taken the slot from. */
export type DisplacedSession = {
  scheduleId: number;
  subjectCode: string | null;
  setLabel: string | null;
  day: string | null;
  start: string | null;
  end: string | null;
};

/**
 * A placement the resolver found and deliberately did not take.
 *
 * Resolve applies only plans that give nothing up. When the only way to fit a
 * subject costs an already-saved session its slot, the plan is skipped — that
 * policy is the backend's and does not change here. These entries exist so the
 * refusal is not silent: there IS a solution, this is what it would cost, and
 * the Registrar is the one who may decide to take it.
 *
 * There is deliberately no endpoint that executes one, so this must never be
 * rendered with an Apply button — see the Adjustment Board instead.
 */
export type ResolutionManualReview = {
  type: string;
  strategy: string | null;
  subjectCode: string | null;
  setName: string | null;
  instructorName: string | null;
  moves: unknown[];
  displaces: DisplacedSession[];
  reason: string | null;
};

export type AutoGenerateResolution = {
  passes: number;
  sessionsMoved: number;
  moves: unknown[];
  movesRefused: unknown[];
  unresolved: string[];
  /** Populated only when `unresolved` is non-empty. */
  manualReview: ResolutionManualReview[];
  /** One sentence for the banner — backend copy, rendered verbatim. */
  manualReviewHint: string | null;
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
      /** Current API name; `session_type` is retained for older deployments. */
      session_mode?: string;
      session_type?: "Lecture" | "Lab";
      /** Current API name; `mode` is retained for older deployments. */
      class_mode?: string;
      mode?: string;
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
    moves?: unknown[];
    moves_refused?: unknown[];
    unresolved?: string[];
    manual_review?: {
      type: string;
      strategy?: string | null;
      subject_code?: string | null;
      set_name?: string | null;
      instructor_name?: string | null;
      moves?: unknown[];
      displaces?: {
        schedule_id: number;
        subject_code?: string | null;
        set_label?: string | null;
        day?: string | null;
        start?: string | null;
        end?: string | null;
      }[];
      reason?: string | null;
    }[];
    manual_review_hint?: string | null;
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
 * POST /regular_schedule/generate-schedule — returns a PROPOSAL (nothing
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
      ? "/schedule-generation-proposals/conflict-resolutions"
      : input.strategy === "greedy"
        ? "/schedule-generation-proposals/greedy"
        : input.withRebalance
          ? "/schedule-generation-proposals/rebalanced"
          : "/schedule-generation-proposals";
  const data = await apiPost<AutoGenerateResponse>(endpoint, {
    schoolYear: input.schoolYear,
    semesterNumber: input.semester,
    yearLevel: input.yearLevelLabel,
    programId: input.programId,
    setId: input.setId,
    ...(input.confirmedDailyHourIncreases?.length
      ? { confirmedDailyHourIncreases: input.confirmedDailyHourIncreases }
      : {}),
  });

  const [dayMap] = await Promise.all([getDayMapping()]);
  const nameToCode = dayMap?.nameToCode ?? {};

  const slots = data.day_schedules.flatMap((day) =>
    day.subject_schedules.map((s) => ({
      subjectId: s.subject_id,
      subjectCode: s.subject_code,
      subjectTitle: s.subject_name,
      day: nameToCode[day.day_of_week] ?? ("M" as Day),
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
      mode: normalizeMode(s.class_mode ?? s.mode ?? ""),
      sessionMode: s.session_mode ?? (s.session_type === "Lab" ? "LAB" : "LEC"),
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
          manualReview: (data.resolution.manual_review ?? []).map((item) => ({
            type: item.type,
            strategy: item.strategy ?? null,
            subjectCode: item.subject_code ?? null,
            setName: item.set_name ?? null,
            instructorName: item.instructor_name ?? null,
            moves: item.moves ?? [],
            displaces: (item.displaces ?? []).map((row) => ({
              scheduleId: row.schedule_id,
              subjectCode: row.subject_code ?? null,
              setLabel: row.set_label ?? null,
              day: row.day ?? null,
              start: row.start ?? null,
              end: row.end ?? null,
            })),
            reason: item.reason ?? null,
          })),
          manualReviewHint: data.resolution.manual_review_hint ?? null,
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
          sessionMode: p.session_mode ?? (p.session_type === "Lab" ? "LAB" : "LEC"),
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
  sessionMode?: string;
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

  const [dayMap] = await Promise.all([getDayMapping()]);
  const codeToName = dayMap?.codeToName ?? ({} as Record<Day, string>);

  return apiPost<{ message?: string; warnings?: string[]; rescheduled?: string[] }>("/regular-schedules", {
    schoolYear: input.schoolYear,
    semesterNumber: input.semester,
    programId: input.programId,
    setId: input.setId,
    daySchedules: [...byDay.entries()].map(([day, slots]) => ({
      dayOfWeek: codeToName[day] ?? "Monday",
      subjectSchedules: slots.map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        subjectId: s.subjectId,
        classMode: s.mode,
        sessionMode: s.sessionMode,
        instructorId: s.facultyId,
        instructorName: s.facultyName,
        roomId: s.roomId,
      })),
    })),
  });
}


export type ScheduleYearLevelOption = { id: number; name: string };

type CreationContextResponse = {
  year_levels: { year_level_int: number; year_level_name: string }[];
  semesters: { semester_int: number; semester_name: string }[];
};

/**
 * GET /regular-schedules/options — year levels & semesters
 * scoped to schedule creation. Only the year levels are safe to source from here:
 * the semesters this returns are just the 1st/2nd Semester label vocabulary, not
 * real Semester rows; term-scoped APIs use `semesterNumber`.
 */
async function getCreationContext(): Promise<{ yearLevels: ScheduleYearLevelOption[] }> {
  const data = await apiGet<CreationContextResponse>(
    "/regular-schedules/options",
  );
  return {
    yearLevels: data.year_levels.map((y) => ({ id: y.year_level_int, name: y.year_level_name })),
  };
}

/** PATCH /regular-schedules/<id>/placement — moves a saved session to a new day/time/room. 409 on conflict. */
async function updateRegularSlot(
  id: number,
  input: { dayOfWeek: string; startTime: string; endTime: string; roomId?: number | null },
): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/regular-schedules/${id}/placement`, input);
  return apiMessage(data);
}

/** PUT /regular-schedules/<id> — reassign room/instructor/subject/mode at the same slot (or move if day/time given). */
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
  if (input.mode != null) payload.classMode = input.mode;
  if (input.instructorId != null) payload.instructorId = input.instructorId;
  if (input.roomId != null) payload.roomId = input.roomId;
  const data = await apiPut<{ message?: string }>(`/regular-schedules/${id}`, payload);
  return apiMessage(data);
}

/** GET /regular-schedules/<id> — one regular session detail. */
async function getRegularSchedule(id: number): Promise<unknown> {
  return apiGet(`/regular-schedules/${id}`);
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
  }>(`/sets/${setId}/regular-schedules?${query}`);
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
  }>("/sets/schedule-status");
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
      "/scheduling/instructor-ledger-reconciliations",
      payload,
    );
  }
  const query = appendTermScopeParams(new URLSearchParams(), params.syId, params.semesterNumber);
  return apiGet<InstructorLedgerReconciliation>(
    `/scheduling/instructor-ledger-reconciliations?${query}`,
  );
}

/** GET /scheduling/options/subject-types — string array of subject types. */
async function getSubjectTypeOptions(): Promise<string[]> {
  const data = await apiGet<{ subject_types: string }[]>("/scheduling/options/subject-types");
  return data.map((d) => d.subject_types);
}

/** GET /scheduling/class-mode-policies — list class mode policies for a term. */
async function listClassModePolicies(params: {
  syId: number;
  semesterNumber: number;
}): Promise<ClassModePolicy[]> {
  const query = appendTermScopeParams(
    new URLSearchParams(),
    params.syId,
    params.semesterNumber,
  );
  return apiGet<ClassModePolicy[]>(`/scheduling/class-mode-policies?${query}`);
}

/** POST /scheduling/class-mode-policies — create or update class mode policy. */
async function upsertClassModePolicy(input: {
  syId: number;
  semesterNumber: number;
  classMode: string;
  subjectId?: number | null;
  subjectType?: string | null;
  setId?: number | null;
  onlineMeetings?: number;
  note?: string | null;
}): Promise<{ id: number; created: boolean; message: string }> {
  const data = await apiPost<{ id: number; created: boolean; message?: string }>(
    "/scheduling/class-mode-policies",
    {
      syId: input.syId,
      semesterNumber: input.semesterNumber,
      classMode: input.classMode,
      subjectId: input.subjectId ?? null,
      subjectType: input.subjectType ?? null,
      setId: input.setId ?? null,
      onlineMeetings: input.onlineMeetings ?? 0,
      note: input.note ?? null,
    },
  );
  return { id: data.id, created: data.created, message: apiMessage(data) };
}

/** DELETE /scheduling/class-mode-policies/:id — delete class mode policy. */
async function deleteClassModePolicy(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/scheduling/class-mode-policies/${id}`);
  return apiMessage(data);
}

/** GET /scheduling/options/subject-types — subject type dropdown for weekly hour allocation. */
async function listSubjectTypeOptions(): Promise<{ value: string; label: string }[]> {
  const data = await apiGet<{ subject_types: string }[]>("/scheduling/options/subject-types");
  return data.map((d) => ({ value: d.subject_types, label: d.subject_types }));
}

/** GET /scheduling/options/programs — program dropdown for schedule generation. */
async function listSchedulePrograms(params: { syId?: number; semesterNumber?: number } = {}): Promise<unknown> {
  const query = new URLSearchParams();
  if (params.syId != null) query.set("syId", String(params.syId));
  if (params.semesterNumber != null) query.set("semesterNumber", String(params.semesterNumber));
  return apiGet(`/scheduling/options/programs${query.size ? `?${query}` : ""}`);
}

/** GET /schedule-audit-logs/filters */
async function scheduleAuditLogFilters(): Promise<unknown> {
  return apiGet("/schedule-audit-logs/filters");
}

/** GET /schedule-audit-logs */
async function listScheduleAuditLog(params: {
  syId?: number;
  semesterNumber?: number;
  action?: string;
  performedBy?: number;
  setCode?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<unknown> {
  const query = new URLSearchParams();
  if (params.syId != null) query.set("sy_id", String(params.syId));
  if (params.semesterNumber != null) query.set("semester_number", String(params.semesterNumber));
  if (params.action) query.set("action", params.action);
  if (params.performedBy != null) query.set("performed_by", String(params.performedBy));
  if (params.setCode) query.set("set_code", params.setCode);
  if (params.dateFrom) query.set("date_from", params.dateFrom);
  if (params.dateTo) query.set("date_to", params.dateTo);
  if (params.page != null) query.set("page", String(params.page));
  if (params.perPage != null) query.set("per_page", String(params.perPage));
  const qs = query.toString();
  return apiGet(`/schedule-audit-logs${qs ? `?${qs}` : ""}`);
}

/** GET /sets/:setId/finalized-major-schedules — preloads protected Registrar-finalized major meetings. */
async function getFinalizedMajorPreload(
  setId: number,
  params: { syId: number; semesterNumber: number; programId?: number },
): Promise<FinalizedMajorMeeting[]> {
  const query = new URLSearchParams({
    syId: String(params.syId),
    semesterNumber: String(params.semesterNumber),
  });
  if (params.programId != null) query.set("programId", String(params.programId));
  const data = await apiGet<{ finalized_majors: FinalizedMajorMeeting[] }>(
    `/sets/${setId}/finalized-major-schedules?${query}`,
  );
  return data.finalized_majors ?? [];
}

/** POST /deans/instructor-schedule-responses/:responseId/decisions — dean decision on instructor suggestions. */
async function decideInstructorResponse(
  responseId: number,
  approveOrDecision: boolean | "accepted" | "rejected" | "approve" | "reject",
  note?: string,
): Promise<{ message?: string }> {
  const approve =
    typeof approveOrDecision === "boolean"
      ? approveOrDecision
      : approveOrDecision === "accepted" || approveOrDecision === "approve";
  return apiPost(`/deans/instructor-schedule-responses/${responseId}/decisions`, {
    approve,
    ...(note ? { note } : {}),
  });
}

/** POST /registrar/instructor-schedule-responses/:responseId/decisions — registrar decision on instructor suggestions. */
async function decideRegistrarInstructorResponse(
  responseId: number,
  approveOrDecision: boolean | "accepted" | "rejected" | "approve" | "reject",
  note?: string,
): Promise<{ message?: string }> {
  const approve =
    typeof approveOrDecision === "boolean"
      ? approveOrDecision
      : approveOrDecision === "accepted" || approveOrDecision === "approve";
  return apiPost(`/registrar/instructor-schedule-responses/${responseId}/decisions`, {
    approve,
    ...(note ? { note } : {}),
  });
}

/** POST /registrar/major-schedules — create registrar major schedule. */
async function createRegistrarMajorSchedule(
  payload: Record<string, unknown>,
): Promise<{ message?: string; schedule?: unknown }> {
  return apiPost("/registrar/major-schedules", payload);
}

/** PUT /registrar/major-schedules/:scheduleId — update registrar major schedule. */
async function updateRegistrarMajorSchedule(
  scheduleId: number,
  payload: Record<string, unknown>,
): Promise<{ message?: string; schedule?: unknown }> {
  return apiPut(`/registrar/major-schedules/${scheduleId}`, payload);
}

/** DELETE /registrar/major-schedules/:scheduleId — delete registrar major schedule with required reason. */
async function deleteRegistrarMajorSchedule(
  scheduleId: number,
  reason: string,
): Promise<{ message?: string; deleted?: unknown }> {
  return apiDelete(`/registrar/major-schedules/${scheduleId}`, { reason });
}

/** POST /registrar/scheduling-terms/:syId/:semesterNumber/programs/:programId/publications — publish program schedule. */
async function publishProgramSchedule(
  syId: number,
  semesterNumber: number,
  programId: number,
): Promise<{ message?: string; programAbbrev?: string; published?: number; alreadyPublished?: number; setIds?: number[]; termFinalized?: boolean }> {
  return apiPost(`/registrar/scheduling-terms/${syId}/${semesterNumber}/programs/${programId}/publications`);
}

/** PATCH /regular-schedules/:regularSchedId/placement — atomic reschedule regular class slot. */
async function rescheduleRegularSchedule(
  regularSchedId: number,
  payload: Record<string, unknown>,
): Promise<{ message?: string }> {
  return apiPatch(`/regular-schedules/${regularSchedId}/placement`, payload);
}

export type InstructorScheduleHoldingMeeting = {
  id: number;
  syId: number;
  semesterNumber: number;
  subjectId: number;
  subjectCode: string;
  subjectName?: string;
  setId: number;
  setName: string;
  programId?: number;
  programAbbrev?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classMode: string;
  roomId?: number | null;
  roomName?: string | null;
  isFloating?: boolean;
};

export type InstructorScheduleHoldingsResult = {
  instructorProfileId: number;
  instructorName: string;
  isActive: boolean;
  meetingCount: number;
  sectionCount: number;
  subjectCount: number;
  weeklyHours: number;
  meetings: InstructorScheduleHoldingMeeting[];
};

export type VacateInstructorSchedulesInput = {
  syId: number;
  semesterNumber: number;
  reason: string;
};

export type ChangeRegularScheduleInstructorInput = {
  instructorId: number | null;
  reason: string;
};

export type ChangeRegularScheduleClassModeInput = {
  classMode: string;
  reason: string;
  roomId?: number | null;
};

/** GET /instructors/:instructorProfileId/schedule-holdings — Everything an instructor is still on timetable for. */
async function getInstructorScheduleHoldings(
  instructorProfileId: number,
  params?: { syId?: number; semesterNumber?: number },
): Promise<InstructorScheduleHoldingsResult> {
  const query = new URLSearchParams();
  if (params?.syId != null) query.set("sy_id", String(params.syId));
  if (params?.semesterNumber != null) query.set("semester_number", String(params.semesterNumber));
  return apiGet<InstructorScheduleHoldingsResult>(
    `/instructors/${instructorProfileId}/schedule-holdings${query.size ? `?${query}` : ""}`,
  );
}

/** POST /registrar/instructors/:instructorProfileId/schedule-vacancies — Take an instructor off every meeting in a term. */
async function vacateInstructorSchedules(
  instructorProfileId: number,
  payload: VacateInstructorSchedulesInput,
): Promise<{ message?: string; vacatedCount?: number; [key: string]: unknown }> {
  return apiPost(
    `/registrar/instructors/${instructorProfileId}/schedule-vacancies`,
    payload,
  );
}

/** PATCH /registrar/regular-schedules/:regularSchedId/instructor — Change instructor of a published meeting or set TBA. */
async function changeRegularScheduleInstructor(
  regularSchedId: number,
  payload: ChangeRegularScheduleInstructorInput,
): Promise<{ message?: string; schedule?: unknown; updatedSchedules?: unknown[]; updatedCount?: number }> {
  return apiPatch(
    `/registrar/regular-schedules/${regularSchedId}/instructor`,
    payload,
  );
}

/** PATCH /registrar/regular-schedules/:regularSchedId/class-mode — Switch published meeting class mode. */
async function changeRegularScheduleClassMode(
  regularSchedId: number,
  payload: ChangeRegularScheduleClassModeInput,
): Promise<{ message?: string; schedule?: unknown }> {
  return apiPatch(
    `/registrar/regular-schedules/${regularSchedId}/class-mode`,
    payload,
  );
}

export const scheduleService = {
  view,
  viewAttestations,
  listScheduleSubjects,
  listScheduleRooms,
  autoGenerate,
  createRegular,
  getCreationContext,
  getRegularSchedule,
  updateRegular,
  updateRegularSlot,
  removeSetSchedules,
  getSetWithSchedules,
  reconcileInstructorLedgers,
  listSubjectTypeOptions,
  getSubjectTypeOptions,
  listClassModePolicies,
  upsertClassModePolicy,
  deleteClassModePolicy,
  listSchedulePrograms,
  scheduleAuditLogFilters,
  listScheduleAuditLog,
  getFinalizedMajorPreload,
  decideInstructorResponse,
  decideRegistrarInstructorResponse,
  createRegistrarMajorSchedule,
  updateRegistrarMajorSchedule,
  deleteRegistrarMajorSchedule,
  publishProgramSchedule,
  rescheduleRegularSchedule,
  getInstructorScheduleHoldings,
  vacateInstructorSchedules,
  changeRegularScheduleInstructor,
  changeRegularScheduleClassMode,
};

