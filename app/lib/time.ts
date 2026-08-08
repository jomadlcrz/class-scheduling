/**
 * Shared schedule time math.
 *
 * Single source for parsing/formatting class times across schedule views.
 */

/** Convert a "HH:MM" or "H:MM AM/PM" time into 24-hour "HH:MM" form. Idempotent on already-24h input. */
export function normalizeTime(value: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!match) return trimmed;
  let hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  const meridiem = match[3] ? match[3].toUpperCase() : null;
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

/**
 * Decimal-hour value of a single time, tolerant of school-day 12h shorthand
 * (e.g. "1:00" is treated as 13:00, since classes do not start at 1 AM).
 */
function parseHourValue(value: string): number {
  const [hourText, minuteText] = value.split(":");
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  const normalizedHour = hour >= 7 || hour === 12 ? hour : hour + 12;
  return normalizedHour + (Number.isFinite(minute) ? minute / 60 : 0);
}

/** Duration in decimal hours for a "start-end" slot time. Returns 0 for invalid/zero ranges. */
export function getSlotDuration(slotTime: string): number {
  const [startText, endText] = slotTime.split("-").map((value) => value.trim());
  const start = parseHourValue(normalizeTime(startText ?? null));
  const end = parseHourValue(normalizeTime(endText ?? null));
  return end > start ? end - start : 0;
}

/** Format a 24-hour "HH:MM" time as 12-hour with meridiem (e.g. "07:30" -> "7:30 AM"). */
export function formatTime12h(value: string): string {
  if (!value) return "";
  const normalized = normalizeTime(value);
  const [hourText, minuteText] = normalized.split(":");
  const hour = Number.parseInt(hourText, 10);
  if (!Number.isFinite(hour)) return value;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteText} ${meridiem}`;
}

/** Format a decimal-hour value (e.g. 9.5) as 12-hour clock time (e.g. "9:30 AM"). */
export function formatDecimalHour(value: number): string {
  const totalMinutes = Math.round(value * 60);
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

/** Absolute "Aug 8, 2026, 2:30 PM"-style stamp for an ISO timestamp. Empty string for null/invalid. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Human "time ago" for an ISO timestamp (e.g. "2 days ago", "just now"). Empty string for null/invalid. */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const abs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const suffix = diffMs < 0 ? "from now" : "ago";
  const unit = (n: number, name: string) => `${n} ${name}${n === 1 ? "" : "s"} ${suffix}`;
  if (abs < minute) return "just now";
  if (abs < hour) return unit(Math.round(abs / minute), "minute");
  if (abs < day) return unit(Math.round(abs / hour), "hour");
  if (abs < 30 * day) return unit(Math.round(abs / day), "day");
  return formatDateTime(iso);
}

/** Whole days elapsed since an ISO timestamp; null for null/invalid input. */
export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000));
}

/** Minutes-since-midnight for a time string ("7:00 AM", "07:00", "13:30"). Useful as a sort key. */
export function timeToMinutes(time: string): number {
  const [hourText, minuteText = "0"] = normalizeTime(time).split(":");
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  if (!Number.isFinite(hour)) return 0;
  return hour * 60 + (Number.isFinite(minute) ? minute : 0);
}
