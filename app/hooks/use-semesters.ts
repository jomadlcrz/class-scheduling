import { useCallback, useEffect, useMemo, useState } from "react";
import { semesterService } from "~/services/semester.service";
import type { Semester } from "~/types/semester";

type UseSemestersResult = {
  semesters: Semester[];
  semesterLabel: (n: number) => string;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useSemesters(): UseSemestersResult {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await semesterService.list();
    setSemesters(data);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setSemesters([]))
      .finally(() => setLoading(false));
  }, [refresh]);

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
