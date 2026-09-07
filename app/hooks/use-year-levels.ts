import { useCallback, useMemo } from "react";
import { enumService, type YearLevelOption } from "~/services/enum.service";
import { useCachedData } from "~/hooks/use-cached-data";

type UseYearLevelsResult = {
  yearLevels: YearLevelOption[];
  yearLevelLabel: (n: number) => string;
  yearLevelIds: number[];
  loading: boolean;
};

function formatOrdinalYear(n: number): string {
  if (n === 1) return "1st Year";
  if (n === 2) return "2nd Year";
  if (n === 3) return "3rd Year";
  return `${n}th Year`;
}

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
    (n: number) => labelMap.get(n) ?? formatOrdinalYear(n),
    [labelMap],
  );

  const yearLevelIds = useMemo(
    () => yearLevels.map((yl) => yl.id),
    [yearLevels],
  );

  return { yearLevels, yearLevelLabel, yearLevelIds, loading };
}
