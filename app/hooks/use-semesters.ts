import { useCallback, useMemo } from "react";
import { semesterService } from "~/services/semester.service";
import { useCachedData } from "~/hooks/use-cached-data";
import type { Semester } from "~/types/semester";

type UseSemestersResult = {
  semesters: Semester[];
  semesterLabel: (n: number) => string;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useSemesters(): UseSemestersResult {
  // Shared cache key (also primed by other pages) so revisits/reloads skip loading.
  const { data, reload } = useCachedData("semesters", () => semesterService.list());
  const semesters = useMemo(() => data ?? [], [data]);
  const loading = data === null;

  const refresh = useCallback(async () => {
    await reload();
  }, [reload]);

  const semesterMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of semesters) m.set(s.semesterNumber, s.semester);
    return m;
  }, [semesters]);

  const semesterLabel = useCallback(
    (n: number) => semesterMap.get(n) ?? `Semester ${n}`,
    [semesterMap],
  );

  return { semesters, semesterLabel, loading, refresh };
}
