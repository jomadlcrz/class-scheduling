import { useCallback, useEffect, useMemo, useState } from "react";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";

type UseSchoolYearsResult = {
  schoolYears: SchoolYearOption[];
  defaultSchoolYear: string;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useSchoolYears(): UseSchoolYearsResult {
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await schoolYearService.list();
    setSchoolYears(data);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setSchoolYears([]))
      .finally(() => setLoading(false));
  }, [refresh]);

  const defaultSchoolYear = useMemo(
    () =>
      schoolYears[0]?.schoolYear ?? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    [schoolYears],
  );

  return { schoolYears, defaultSchoolYear, loading, refresh };
}
