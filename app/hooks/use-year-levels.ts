import { useCallback, useEffect, useMemo, useState } from "react";
import { enumService, type YearLevelOption } from "~/services/enum.service";

type UseYearLevelsResult = {
  yearLevels: YearLevelOption[];
  yearLevelLabel: (n: number) => string;
  yearLevelIds: number[];
  loading: boolean;
};

export function useYearLevels(): UseYearLevelsResult {
  const [yearLevels, setYearLevels] = useState<YearLevelOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enumService
      .getOptions()
      .then((opts) => setYearLevels(opts.yearLevels ?? []))
      .catch(() => setYearLevels([]))
      .finally(() => setLoading(false));
  }, []);

  const labelMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const yl of yearLevels) m.set(yl.id, yl.name);
    return m;
  }, [yearLevels]);

  const yearLevelLabel = useCallback(
    (n: number) => labelMap.get(n) ?? `${n}th Year`,
    [labelMap],
  );

  const yearLevelIds = useMemo(
    () => yearLevels.map((yl) => yl.id),
    [yearLevels],
  );

  return { yearLevels, yearLevelLabel, yearLevelIds, loading };
}
