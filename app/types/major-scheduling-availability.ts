/**
 * What the Major Scheduling room map cannot say — see
 * MajorSchedulingAvailabilityService on the backend.
 *
 * That map is fed by list_major_submissions, which is department-scoped for a
 * Dean, so a room another department's live timetable already holds draws as
 * free and nothing says whether an instructor is at their cap. This is the
 * read that closes both gaps before a meeting is placed rather than at
 * Registrar finalize.
 *
 * Every `| null` below means "not asked", not "unknown": the fields that
 * depend on a program, a subject or a slot stay null until one is supplied,
 * so the drawer can render a browser and a verdict from one shape.
 */

/** One meeting standing in a room's or an instructor's way. */
export type AvailabilityBusy = {
  startTime: string; // "HH:MM", 24h
  endTime: string;
  hours: number;
  /**
   * `committed` is a regular_schedules row — the real timetable,
   * institution-wide, so this is what catches a room lost to another
   * department. `draft` is this department's own unsaved Major build.
   */
  source: "committed" | "draft";
  /** "SUBJ101 · BSIT-2A", or "Reserved" when the row names neither. */
  label: string;
};

export type AvailabilityWindow = {
  startTime: string;
  endTime: string;
  hours: number;
};

/**
 * Hours against a cap.
 *
 * The Availability drawer reads `assigned` and nothing else here: it measures a
 * day against the operating window, not against `cap`. A daily cap is a stored
 * high-water mark that no longer matches any rule once the schedule that raised
 * it is gone, which is why it is not what that panel shows. `cap`/`remaining`
 * stay on the wire for the WEEKLY figures, which are genuinely enforced.
 */
export type AvailabilityHours = {
  /** Tracked by instructor_teaching_terms.current_weekly_hours. */
  committed: number;
  /** The Dean's own draft — what that ledger is blind to. */
  draft: number;
  assigned: number;
  cap: number;
  /** May go negative: a draft can already have overshot a cap nothing checked. */
  remaining: number;
};

export type AvailabilityRoomDay = {
  day: string;
  busy: AvailabilityBusy[];
  free: AvailabilityWindow[];
  freeHours: number;
};

export type AvailabilityInstructorDay = AvailabilityRoomDay & {
  hours: AvailabilityHours;
};

/**
 * Which Major workspace the reading belongs to.
 *
 * Not cosmetic: it selects the endpoint AND the conflict scope the answer is
 * computed against, mirroring the split MajorCpSatGenerateService already
 * makes between _busy_sets and _busy_sets_institution_wide.
 */
export type MajorAvailabilityWorkspace = "dean" | "registrar";

/** One program in reach — the Dean's own, or any of the college's. */
export type AvailabilityProgram = {
  programId: number;
  programAbbrev: string;
  programName: string;
};

export type AvailabilityRoom = {
  id: number;
  name: string;
  type: string;
  capacity: number | null;
  buildingId: number;
  buildingName: string;
  /**
   * Which of the Dean's own programs may enter this room, per room_programs.
   * Never empty: a room no program of theirs may use is not listed at all.
   * With one program named this is just that program; unscoped it is every
   * one of the department's that may use the room, which is the distinction
   * the union would otherwise hide.
   */
  allowedPrograms: Pick<AvailabilityProgram, "programId" | "programAbbrev">[];
  byDay: AvailabilityRoomDay[];
  /** Week total, across every scheduling day. */
  freeHours: number;
  /** null when no slot was given; otherwise whether it is free for that slot. */
  freeForSlot: boolean | null;
  /** null when no slot was given; [] when nothing is in the way. */
  blockedBy: AvailabilityBusy[] | null;
};

export type AvailabilityInstructor = {
  instructorProfileId: number;
  teachingTermId: number;
  name: string;
  employeeId: string | null;
  /** Their department. Carried for the Registrar's sake — a college-wide
   *  roster is a list of strangers without it. */
  departmentAbbrev: string;
  /** null when no subject was named. Assignment, not eligibility. */
  assignedToSubject: boolean | null;
  weekly: AvailabilityHours;
  byDay: AvailabilityInstructorDay[];
  freeForSlot: boolean | null;
  blockedBy: AvailabilityBusy[] | null;
  /** false exactly when capWarnings is non-empty. Weekly cap only. */
  fitsCapsForSlot: boolean | null;
  /** Ready to render. Weekly cap only — the daily one is not this read's
   *  yardstick, the operating day is. */
  capWarnings: string[];
};

export type MajorSchedulingAvailability = {
  syId: number;
  semesterNumber: number;
  departmentId: number;
  /**
   * Which build counted as the draft half, and how wide the reading was.
   * `dean` pairs the committed timetable with ONE department's
   * DeanMajorSchedule; `registrar` pairs it with RegistrarMajorSchedule,
   * institution-wide and with no department boundary.
   */
  workspace: MajorAvailabilityWorkspace;
  /** Echo of the program filter, null when the reading is program-wide. */
  programId: number | null;
  /** The Dean's own active programs — the room filter's options. */
  programs: AvailabilityProgram[];
  /** Monday … Saturday, the order every `byDay` array is in. */
  days: string[];
  dayWindow: {
    startTime: string;
    endTime: string;
    /**
     * Reported, not enforced. Whether a meeting may straddle the break is a
     * rule about the SUBJECT — a Major with Lab is exempt on both halves by
     * design — so the backend shades nothing and leaves it to the drawer.
     */
    lunch: { startTime: string; endTime: string };
  };
  /** null unless dayOfWeek + startTime + endTime were all supplied. */
  slot: { dayOfWeek: string; startTime: string; endTime: string; hours: number } | null;
  rooms: AvailabilityRoom[];
  instructors: AvailabilityInstructor[];
};

/** Query for one availability read. Every field but the term is optional. */
export type MajorSchedulingAvailabilityQuery = {
  syId: number;
  semesterNumber: number;
  /** Defaults to "dean". Picks the endpoint and the conflict scope. */
  workspace?: MajorAvailabilityWorkspace;
  /** Registrar only — narrows a college-wide reading to one department.
   *  Ignored for a Dean, who is always pinned to their own. */
  departmentId?: number | null;
  /** One of the Dean's own programs; anything else is refused with a 403.
   *  Omitted means the union across their department's programs — never the
   *  college's whole room inventory. */
  programId?: number | null;
  subjectId?: number | null;
  /** Preferred over subjectId — keeps the same subject in another program or
   *  year from leaking instructors into this offering. */
  curriculumDetailId?: number | null;
  /** All three or none; the backend 400s on a half-specified slot. */
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  /** A Dean draft to ignore, so a meeting being moved cannot block its own move. */
  excludeScheduleId?: number | null;
  /**
   * Drop from the ROSTER (never the rooms) anyone carrying no Major subject
   * this term. Both Major Scheduling pages set it: a department's full roster
   * is mostly GenEd and minor staff those pages can never assign, and their
   * free hours are noise between the names that matter.
   *
   * Generate Schedule shares this drawer and deliberately leaves it off —
   * there every instructor is a real candidate.
   */
  majorOnly?: boolean;
};
