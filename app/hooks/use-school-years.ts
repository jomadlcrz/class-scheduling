import { useCallback, useMemo } from "react";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { useCachedData } from "~/hooks/use-cached-data";

type UseSchoolYearsResult = {
  schoolYears: SchoolYearOption[];
  defaultSchoolYear: string;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useSchoolYears(): UseSchoolYearsResult {
  // Shared cache key (also primed by other pages) so revisits/reloads skip loading.
  const { data, reload } = useCachedData("school-years", () => schoolYearService.list());

  const schoolYears = useMemo(
    () =>
      [...(data ?? [])].sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        return b.schoolYear.localeCompare(a.schoolYear);
      }),
    [data],
  );

  const loading = data === null;

  const refresh = useCallback(async () => {
    await reload();
  }, [reload]);

  const defaultSchoolYear = useMemo(
    () =>
      schoolYears[0]?.schoolYear ?? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    [schoolYears],
  );

  return { schoolYears, defaultSchoolYear, loading, refresh };
}
