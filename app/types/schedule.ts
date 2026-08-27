import type { YearLevel } from "~/types/subject";

export const DAYS = ["M", "T", "W", "Th", "F", "S"] as const;
export type Day = (typeof DAYS)[number];

export const DAY_LABELS: Record<Day, string> = {
  M: "Monday",
  T: "Tuesday",
  W: "Wednesday",
  Th: "Thursday",
  F: "Friday",
  S: "Saturday",
};

export type ScheduleSemester = number;

export type ClassMode = string;
export type SessionMode = string;
export type ScheduleMode = string;

export type Schedule = {
  id: string;
  schoolYear: string;
  semester: ScheduleSemester;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  /** Subject classification when supplied by the schedule API. */
  subjectType?: string;
  /** Only populated when read via scheduleService.view() (GET /schedule/view). */
  units?: number;
  setId: string;
  setCode: string;
  program: string;
  programName?: string;
  departmentCode: string;
  yearLevel: YearLevel;
  facultyId: string;
  facultyName: string;
  roomId: string;
  roomName: string;
  mode: ScheduleMode;
  /** Backend SessionMode value (for example, LEC or LAB). */
  sessionMode?: string;
  day: Day;
  startTime: string;
  endTime: string;
  /** Only populated for a STUDENT viewer of scheduleService.view(). */
  academicStatus?: string;
};

export type AttestationPerson = {
  name: string;
  position: string;
  departmentAbbrev?: string;
};

export type Attestation = {
  setCode: string;
  schoolYear: string;
  semesterNumber: number;
  preparedBy: AttestationPerson;
  approvedBy: AttestationPerson;
};

/** GET /regular_schedule/<id> response, camelCased. */
export type RegularScheduleDetail = {
  id: number;
  syId: number;
  semester: number;
  programId: number;
  setId: number;
  subjectId: number;
  subjectCode: string;
  mode: string;
  instructorId: number | null;
  roomId: number | null;
  roomName: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

/** Returns time slots from 07:00 to 18:00 in 30-minute increments. */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 17; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  slots.push("18:00");
  return slots;
}

// Re-export time helpers from lib/time.ts as the single source of truth.
export { formatTime12h as formatTime, normalizeTime as parseTime12h, timeToMinutes } from "~/lib/time";

import { getSlotDuration } from "~/lib/time";
/** Two-arg wrapper around lib/time's getSlotDuration for backward compat. */
export function getSlotDurationHours(startTime: string, endTime: string): number {
  return getSlotDuration(`${startTime}-${endTime}`);
}

export type ClassModePolicy = {
  id: number;
  syId: number;
  semesterNumber: number;
  subjectId: number | null;
  subjectCode: string | null;
  descriptiveTitle: string | null;
  setId: number | null;
  setName: string | null;
  subjectType: string | null;
  scope: "subject_type" | "subject" | "section";
  classMode: string;
  /** Blended only: how many of the week's meetings run online. */
  onlineMeetings: number;
  note: string | null;
};

