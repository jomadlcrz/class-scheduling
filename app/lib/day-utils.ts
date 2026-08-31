import { enumService, type DayOfWeekOption } from "~/services/enum.service";

export const DAYS = ["M", "T", "W", "Th", "F", "S"] as const;
export type Day = (typeof DAYS)[number];

export type DayMapping = {
  codeToName: Record<Day, string>;
  nameToCode: Record<string, Day>;
};

let _cache: DayMapping | null = null;

/**
 * Fetches the day-of-week mapping from the backend (GET /enums → day_of_week).
 * Cached after the first call so subsequent uses are instant.
 *
 * Returns `null` if the enum endpoint hasn't loaded yet (fallback callers
 * should supply their own default).
 */
export async function getDayMapping(): Promise<DayMapping | null> {
  if (_cache) return _cache;
  const enums = await enumService.getOptions();
  const days: DayOfWeekOption[] = enums.dayOfWeek ?? [];
  if (days.length !== DAYS.length) return null;

  const codeToName = {} as Record<Day, string>;
  const nameToCode: Record<string, Day> = {};
  for (let i = 0; i < days.length; i++) {
    const code = DAYS[i];
    const name = days[i].name;
    codeToName[code] = name;
    nameToCode[name] = code;
  }
  _cache = { codeToName, nameToCode };
  return _cache;
}
