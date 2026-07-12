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

/** Format a decimal-hour value to at most one decimal place. */
export function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
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

/** Minutes-since-midnight for a time string ("7:00 AM", "07:00", "13:30"). Useful as a sort key. */
export function timeToMinutes(time: string): number {
  const [hourText, minuteText = "0"] = normalizeTime(time).split(":");
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  if (!Number.isFinite(hour)) return 0;
  return hour * 60 + (Number.isFinite(minute) ? minute : 0);
}
