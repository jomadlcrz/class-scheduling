import { useEffect, useMemo, useState } from "react";
import { enumService, type DayOfWeekOption } from "~/services/enum.service";
import { DAYS, DAY_LABELS as STATIC_DAY_LABELS, type Day } from "~/types/schedule";

type UseDaysResult = {
  days: DayOfWeekOption[];
  /** Full day name per short code, e.g. dayLabels.M === "Monday". Falls back to the static label until the fetch resolves. */
  dayLabels: Record<Day, string>;
  loading: boolean;
};

/**
 * Backend DayOfWeek enum (GET /enums -> day_of_week), ordered Monday..Saturday —
 * matched by position to the frontend's short-code Day identifiers in DAYS, since
 * the backend enum carries full names/ids, not the short codes used as grid keys.
 */
export function useDays(): UseDaysResult {
  const [days, setDays] = useState<DayOfWeekOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enumService
      .getOptions()
      .then((opts) => setDays(opts.dayOfWeek ?? []))
      .catch(() => setDays([]))
      .finally(() => setLoading(false));
  }, []);

  const dayLabels = useMemo(() => {
    if (days.length !== DAYS.length) return STATIC_DAY_LABELS;
    return Object.fromEntries(
      DAYS.map((d, i) => [d, days[i]?.name ?? STATIC_DAY_LABELS[d]]),
    ) as Record<Day, string>;
  }, [days]);

  return { days, dayLabels, loading };
}
