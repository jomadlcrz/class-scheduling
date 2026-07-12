import { useCallback, useEffect, useMemo, useState } from "react";
import { semesterService } from "~/services/semester.service";
import type { Semester } from "~/types/semester";

type UseSemestersResult = {
  semesters: Semester[];
  semesterLabel: (n: number) => string;
  loading: boolean;
};

export function useSemesters(): UseSemestersResult {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    semesterService
      .list()
      .then(setSemesters)
      .catch(() => setSemesters([]))
      .finally(() => setLoading(false));
  }, []);

  const semesterMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of semesters) m.set(s.semesterNumber, s.semester);
    return m;
  }, [semesters]);

  const semesterLabel = useCallback(
    (n: number) => semesterMap.get(n) ?? `Semester ${n}`,
    [semesterMap],
  );

  return { semesters, semesterLabel, loading };
}
