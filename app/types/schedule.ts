import type { YearLevel } from "./subject";

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

export const SCHEDULE_SEMESTERS = [1, 2, 3] as const;
export type ScheduleSemester = (typeof SCHEDULE_SEMESTERS)[number];

export const SCHEDULE_SEMESTER_LABELS: Record<ScheduleSemester, string> = {
  1: "1st Semester",
  2: "2nd Semester",
  3: "Summer",
};

export const SCHEDULE_MODES = ["F2F", "Online"] as const;
export type ScheduleMode = (typeof SCHEDULE_MODES)[number];

export const SCHEDULE_MODE_LABELS: Record<ScheduleMode, string> = {
  F2F: "F2F",
  Online: "Online",
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

/** Formats "07:00" → "7:00 AM", "13:30" → "1:30 PM". */
export function formatTime(time: string): string {
  const [hourStr, min] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const period = hour < 12 ? "AM" : "PM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${min} ${period}`;
}

export const SCHOOL_YEARS = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"] as const;
export const DEFAULT_SCHOOL_YEAR = "2025-2026";
