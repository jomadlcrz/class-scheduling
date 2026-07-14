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

const DAY_SHORT: Record<Day, string> = {
  M: "Mon",
  T: "Tue",
  W: "Wed",
  Th: "Thu",
  F: "Fri",
  S: "Sat",
};

export type ScheduleSemester = number;

export const SCHEDULE_MODES = ["F2F", "Online", "Modular"] as const;
export type ScheduleMode = (typeof SCHEDULE_MODES)[number];

export const SCHEDULE_MODE_LABELS: Record<ScheduleMode, string> = {
  F2F: "F2F",
  Online: "Online",
  Modular: "Modular",
};

export type Schedule = {
  id: string;
  schoolYear: string;
  semester: ScheduleSemester;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  setId: string;
  setCode: string;
  program: string;
  departmentCode: string;
  yearLevel: YearLevel;
  facultyId: string;
  facultyName: string;
  roomId: string;
  roomName: string;
  buildingCode: string;
  mode: ScheduleMode;
  day: Day;
  startTime: string;
  endTime: string;
};

export type CreateScheduleInput = Omit<Schedule, "id">;
export type UpdateScheduleInput = Partial<CreateScheduleInput>;

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

// Re-export schedule-day constants from lib/schedule-days.ts.
export {
  SCHEDULE_DAY_ORDER,
  SCHEDULE_DAYS,
  SCHEDULE_DAY_NAMES,
  getScheduleDayKey,
  SCHEDULE_DAY_COLORS,
  type ScheduleDay,
} from "~/lib/schedule-days";
