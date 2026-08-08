import { useCallback, useMemo } from "react";
import { enumService, type YearLevelOption } from "~/services/enum.service";
import { useCachedData } from "~/hooks/use-cached-data";

type UseYearLevelsResult = {
  yearLevels: YearLevelOption[];
  yearLevelLabel: (n: number) => string;
  yearLevelIds: number[];
  loading: boolean;
};

export function useYearLevels(): UseYearLevelsResult {
  // Derived from the shared enums cache so revisits/reloads skip the loading state.
  const { data } = useCachedData("enums", () => enumService.getOptions());
  const yearLevels = useMemo(() => data?.yearLevels ?? [], [data]);
  const loading = data === null;

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
