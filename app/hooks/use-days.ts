import { useMemo } from "react";
import { enumService, type DayOfWeekOption } from "~/services/enum.service";
import { useCachedData } from "~/hooks/use-cached-data";
import { DAYS, type Day } from "~/lib/day-utils";

type UseDaysResult = {
  days: DayOfWeekOption[];
  /** Full day name per short code, e.g. dayLabels.M === "Monday". Falls back to undefined until the fetch resolves. */
  dayLabels: Record<Day, string>;
  loading: boolean;
};

/**
 * Backend DayOfWeek enum (GET /enums -> day_of_week), ordered Monday..Saturday —
 * matched by position to the frontend's short-code Day identifiers in DAYS, since
 * the backend enum carries full names/ids, not the short codes used as grid keys.
 */
export function useDays(): UseDaysResult {
  // Derived from the shared enums cache so revisits/reloads skip the loading state.
  const { data } = useCachedData("enums", () => enumService.getOptions());
  const days = useMemo(() => data?.dayOfWeek ?? [], [data]);
  const loading = data === null;

  const dayLabels = useMemo(() => {
    if (days.length !== DAYS.length) return {} as Record<Day, string>;
    return Object.fromEntries(
      DAYS.map((d, i) => [d, days[i]?.name ?? ""]),
    ) as Record<Day, string>;
  }, [days]);

  return { days, dayLabels, loading };
}
