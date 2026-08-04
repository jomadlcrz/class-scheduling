import { apiGet } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import type {
  LabAnalysis,
  LabConflict,
  LabDay,
  LabFreeSlot,
  LabFreeWindow,
  LabProgramAccessRow,
  LabRoom,
  LabSession,
  LabSlotRow,
  LabSlotTemplateEntry,
} from "~/types/lab-analysis";

/** Laboratory capacity board (registrar_admin schedules module, LabAnalysisService). */

type SessionResponse = {
  regular_sched_id: number;
  day: string;
  start_time: string;
  end_time: string;
  hours: number;
  subject_id: number | null;
  subject_code: string | null;
  descriptive_title: string | null;
  subject_type: string | null;
  program_id: number | null;
  program_abbrev: string | null;
  set_id: number | null;
  set_code: string | null;
  year_level: number | null;
  instructor_id: number | null;
  instructor: string | null;
  mode: string | null;
};

type SlotTemplateResponse = {
  slot: string;
  start_time: string;
  end_time: string;
  hours: number;
};

type SlotRowResponse = SlotTemplateResponse & {
  status: "occupied" | "free";
  occupied_by: SessionResponse[];
};

type FreeWindowResponse = {
  start_time: string;
  end_time: string;
  hours: number;
};

type ConflictResponse = {
  day: string;
  overlap: string;
  sessions: number[];
  detail: string;
};

type DayResponse = {
  day: string;
  day_index: number;
  sessions: number;
  booked_hours: number;
  free_hours: number;
  hour_utilization_percent: number;
  slots_used: number;
  slots_free: number;
  slots: SlotRowResponse[];
  free_windows: FreeWindowResponse[];
  session_list: SessionResponse[];
};

type FreeSlotResponse = SlotTemplateResponse & {
  day: string;
  day_index: number;
};

type RoomResponse = {
  room_id: number;
  room_name: string;
  room_capacity: number;
  room_status: string | null;
  floor_level: number | null;
  building_id: number | null;
  building: string | null;
  access: {
    is_restricted: boolean;
    programs: { program_id: number; program_abbrev: string | null; program_name: string | null }[];
    note: string;
  };
  usage: {
    sessions: number;
    booked_hours: number;
    window_capacity_hours: number;
    free_hours: number;
    hour_utilization_percent: number;
    slot_capacity: number;
    slots_used: number;
    slots_free: number;
    slot_utilization_percent: number;
    is_fully_booked: boolean;
    largest_free_block_hours: number;
    distinct_programs: number;
    distinct_subjects: number;
    distinct_sets: number;
  };
  by_program: {
    program_id: number | null;
    program_abbrev: string | null;
    sessions: number;
    booked_hours: number;
    share_percent: number;
    sets: string[];
  }[];
  by_day: DayResponse[];
  free_slots: FreeSlotResponse[];
  unslotted_sessions: SessionResponse[];
  conflicts: ConflictResponse[];
};

type ProgramAccessResponse = {
  program_id: number;
  program_abbrev: string | null;
  program_name: string | null;
  laboratories: {
    room_id: number;
    room_name: string;
    slots_free: number;
    slot_utilization_percent: number;
    is_fully_booked: boolean;
    largest_free_block_hours: number;
    own_sessions: number;
    own_booked_hours: number;
  }[];
  slot_capacity: number;
  slots_free: number;
  own_sessions: number;
  own_hours: number;
  free_slots: FreeSlotResponse[];
  can_schedule_a_lab_class: boolean;
  summary: string;
};

type LabAnalysisResponse = {
  term: {
    sy_id: number;
    school_year: string;
    semester_number: number;
  };
  window: {
    days: string[];
    day_start: string;
    day_end: string;
    hours_per_day: number;
    note: string;
  };
  slot_template: SlotTemplateResponse[];
  totals: {
    laboratories: number;
    slots_per_day: number;
    days: number;
    sessions: number;
    booked_hours: number;
    window_capacity_hours: number;
    free_hours: number;
    hour_utilization_percent: number;
    slot_capacity: number;
    slots_used: number;
    slots_free: number;
    slot_utilization_percent: number;
    fully_booked_laboratories: number;
    laboratories_with_free_slots: number;
    conflicts: number;
    unslotted_sessions: number;
  };
  laboratories: RoomResponse[];
  program_access: ProgramAccessResponse[];
};

function mapSlotTemplate(s: SlotTemplateResponse): LabSlotTemplateEntry {
  return { slot: s.slot, startTime: s.start_time, endTime: s.end_time, hours: s.hours };
}

function mapSession(s: SessionResponse): LabSession {
  return {
    regularSchedId: s.regular_sched_id,
    day: s.day,
    startTime: s.start_time,
    endTime: s.end_time,
    hours: s.hours,
    subjectId: s.subject_id,
    subjectCode: s.subject_code,
    descriptiveTitle: s.descriptive_title,
    subjectType: s.subject_type,
    programId: s.program_id,
    programAbbrev: s.program_abbrev,
    setId: s.set_id,
    setCode: s.set_code,
    yearLevel: s.year_level,
    instructorId: s.instructor_id,
    instructor: s.instructor,
    mode: s.mode,
  };
}

function mapSlotRow(s: SlotRowResponse): LabSlotRow {
  return { ...mapSlotTemplate(s), status: s.status, occupiedBy: s.occupied_by.map(mapSession) };
}

function mapFreeWindow(w: FreeWindowResponse): LabFreeWindow {
  return { startTime: w.start_time, endTime: w.end_time, hours: w.hours };
}

function mapFreeSlot(s: FreeSlotResponse): LabFreeSlot {
  return { ...mapSlotTemplate(s), day: s.day, dayIndex: s.day_index };
}

function mapConflict(c: ConflictResponse): LabConflict {
  return { day: c.day, overlap: c.overlap, sessions: c.sessions, detail: c.detail };
}

function mapDay(d: DayResponse): LabDay {
  return {
    day: d.day,
    dayIndex: d.day_index,
    sessions: d.sessions,
    bookedHours: d.booked_hours,
    freeHours: d.free_hours,
    hourUtilizationPercent: d.hour_utilization_percent,
    slotsUsed: d.slots_used,
    slotsFree: d.slots_free,
    slots: d.slots.map(mapSlotRow),
    freeWindows: d.free_windows.map(mapFreeWindow),
    sessionList: d.session_list.map(mapSession),
  };
}

function mapRoom(r: RoomResponse): LabRoom {
  return {
    roomId: r.room_id,
    roomName: r.room_name,
    roomCapacity: r.room_capacity,
    roomStatus: r.room_status,
    floorLevel: r.floor_level,
    buildingId: r.building_id,
    building: r.building,
    access: {
      isRestricted: r.access.is_restricted,
      programs: r.access.programs.map((p) => ({
        programId: p.program_id,
        programAbbrev: p.program_abbrev,
        programName: p.program_name,
      })),
      note: r.access.note,
    },
    usage: {
      sessions: r.usage.sessions,
      bookedHours: r.usage.booked_hours,
      windowCapacityHours: r.usage.window_capacity_hours,
      freeHours: r.usage.free_hours,
      hourUtilizationPercent: r.usage.hour_utilization_percent,
      slotCapacity: r.usage.slot_capacity,
      slotsUsed: r.usage.slots_used,
      slotsFree: r.usage.slots_free,
      slotUtilizationPercent: r.usage.slot_utilization_percent,
      isFullyBooked: r.usage.is_fully_booked,
      largestFreeBlockHours: r.usage.largest_free_block_hours,
      distinctPrograms: r.usage.distinct_programs,
      distinctSubjects: r.usage.distinct_subjects,
      distinctSets: r.usage.distinct_sets,
    },
    byProgram: r.by_program.map((p) => ({
      programId: p.program_id,
      programAbbrev: p.program_abbrev,
      sessions: p.sessions,
      bookedHours: p.booked_hours,
      sharePercent: p.share_percent,
      sets: p.sets,
    })),
    byDay: r.by_day.map(mapDay),
    freeSlots: r.free_slots.map(mapFreeSlot),
    unslottedSessions: r.unslotted_sessions.map(mapSession),
    conflicts: r.conflicts.map(mapConflict),
  };
}

function mapProgramAccess(p: ProgramAccessResponse): LabProgramAccessRow {
  return {
    programId: p.program_id,
    programAbbrev: p.program_abbrev,
    programName: p.program_name,
    laboratories: p.laboratories.map((l) => ({
      roomId: l.room_id,
      roomName: l.room_name,
      slotsFree: l.slots_free,
      slotUtilizationPercent: l.slot_utilization_percent,
      isFullyBooked: l.is_fully_booked,
      largestFreeBlockHours: l.largest_free_block_hours,
      ownSessions: l.own_sessions,
      ownBookedHours: l.own_booked_hours,
    })),
    slotCapacity: p.slot_capacity,
    slotsFree: p.slots_free,
    ownSessions: p.own_sessions,
    ownHours: p.own_hours,
    freeSlots: p.free_slots.map(mapFreeSlot),
    canScheduleALabClass: p.can_schedule_a_lab_class,
    summary: p.summary,
  };
}

/**
 * GET /schedule/laboratory-analysis?sy_id=&semester_number=[&program_id=] — read-only
 * capacity board for every laboratory room: the configured slot grid, who
 * holds each window, free windows, usage split by program, and the same
 * cut per program (`programAccess`) answering "can this program still get
 * a lab class this term". Gated on rooms:read, not schedules:read.
 */
async function analyze(params: { syId: number; semesterNumber: number; programId?: number }): Promise<LabAnalysis> {
  const query = termScopeQuery(params.syId, params.semesterNumber, {
    program_id: params.programId,
  });
  const data = await apiGet<LabAnalysisResponse>(`/schedule/laboratory-analysis${query}`);

  return {
    term: {
      syId: data.term.sy_id,
      schoolYear: data.term.school_year,
      semesterNumber: data.term.semester_number,
    },
    window: {
      days: data.window.days,
      dayStart: data.window.day_start,
      dayEnd: data.window.day_end,
      hoursPerDay: data.window.hours_per_day,
      note: data.window.note,
    },
    slotTemplate: data.slot_template.map(mapSlotTemplate),
    totals: {
      laboratories: data.totals.laboratories,
      slotsPerDay: data.totals.slots_per_day,
      days: data.totals.days,
      sessions: data.totals.sessions,
      bookedHours: data.totals.booked_hours,
      windowCapacityHours: data.totals.window_capacity_hours,
      freeHours: data.totals.free_hours,
      hourUtilizationPercent: data.totals.hour_utilization_percent,
      slotCapacity: data.totals.slot_capacity,
      slotsUsed: data.totals.slots_used,
      slotsFree: data.totals.slots_free,
      slotUtilizationPercent: data.totals.slot_utilization_percent,
      fullyBookedLaboratories: data.totals.fully_booked_laboratories,
      laboratoriesWithFreeSlots: data.totals.laboratories_with_free_slots,
      conflicts: data.totals.conflicts,
      unslottedSessions: data.totals.unslotted_sessions,
    },
    laboratories: data.laboratories.map(mapRoom),
    programAccess: data.program_access.map(mapProgramAccess),
  };
}

export const labAnalysisService = { analyze };
