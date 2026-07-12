import { useEffect, useMemo, useState } from "react";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";

type UseSchoolYearsResult = {
  schoolYears: SchoolYearOption[];
  defaultSchoolYear: string;
  loading: boolean;
};

export function useSchoolYears(): UseSchoolYearsResult {
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    schoolYearService
      .list()
      .then(setSchoolYears)
      .catch(() => setSchoolYears([]))
      .finally(() => setLoading(false));
  }, []);

  const defaultSchoolYear = useMemo(
    () =>
      schoolYears[0]?.schoolYear ?? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    [schoolYears],
  );

  return { schoolYears, defaultSchoolYear, loading };
}
