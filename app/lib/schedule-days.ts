export type ScheduleDay = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export const SCHEDULE_DAY_ORDER: ScheduleDay[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const SCHEDULE_DAYS = [
  { key: "MON" as ScheduleDay, label: "Mon", full: "Monday" },
  { key: "TUE" as ScheduleDay, label: "Tue", full: "Tuesday" },
  { key: "WED" as ScheduleDay, label: "Wed", full: "Wednesday" },
  { key: "THU" as ScheduleDay, label: "Thu", full: "Thursday" },
  { key: "FRI" as ScheduleDay, label: "Fri", full: "Friday" },
  { key: "SAT" as ScheduleDay, label: "Sat", full: "Saturday" },
] as const;

/** Full day names in week order — for data keyed by full name (e.g. room mapping). */
export const SCHEDULE_DAY_NAMES: string[] = SCHEDULE_DAYS.map((day) => day.full);

const SCHEDULE_DAY_KEYS: Record<string, ScheduleDay> = {
  mon: "MON", monday: "MON",
  tue: "TUE", tues: "TUE", tuesday: "TUE",
  wed: "WED", wednesday: "WED",
  thu: "THU", thur: "THU", thurs: "THU", thursday: "THU",
  fri: "FRI", friday: "FRI",
  sat: "SAT", saturday: "SAT",
  m: "MON", t: "TUE", w: "WED", th: "THU", f: "FRI", s: "SAT",
};

export function getScheduleDayKey(day: string): ScheduleDay | null {
  const normalized = day.trim().toLowerCase();
  return (
    SCHEDULE_DAY_KEYS[normalized] ??
    (SCHEDULE_DAY_ORDER.includes(day as ScheduleDay) ? (day as ScheduleDay) : null)
  );
}

/** Per-day accent used across schedule card/table views — mirrors the legacy portal's day tints. */
export const SCHEDULE_DAY_COLORS: Record<
  ScheduleDay,
  { text: string; bg: string; border: string; bar: string }
> = {
  MON: { text: "text-red-600", bg: "bg-red-100", border: "border-l-red-500", bar: "bg-red-500" },
  TUE: { text: "text-amber-600", bg: "bg-amber-100", border: "border-l-amber-500", bar: "bg-amber-500" },
  WED: { text: "text-red-600", bg: "bg-red-100", border: "border-l-red-500", bar: "bg-red-500" },
  THU: { text: "text-amber-600", bg: "bg-amber-100", border: "border-l-amber-500", bar: "bg-amber-500" },
  FRI: { text: "text-red-600", bg: "bg-red-100", border: "border-l-red-500", bar: "bg-red-500" },
  SAT: { text: "text-pink-700", bg: "bg-pink-100", border: "border-l-pink-500", bar: "bg-pink-500" },
};
