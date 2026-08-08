import { useCallback, useMemo } from "react";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import { useCachedData } from "~/hooks/use-cached-data";
import type { ScheduleRelease } from "~/types/schedule-release";

type UseScheduleReleasesResult = {
  releases: ScheduleRelease[];
  loading: boolean;
  refresh: () => Promise<void>;
};

/**
 * Registrar's schedule releases for one school year + semester, refetched whenever either changes.
 * `loading` is true from the moment a term is selected until that term's data has been fetched —
 * never a false gap that lets stale/empty content flash in between the term changing and the fetch
 * starting. Cached per term, so revisiting a term (or reloading the page) shows it instantly.
 */
export function useScheduleReleases(
  syId: number | null,
  semesterNumber: number | null,
): UseScheduleReleasesResult {
  const termKey = syId != null && semesterNumber != null ? `${syId}:${semesterNumber}` : null;

  const { data, reload } = useCachedData(
    `schedule-releases:${termKey ?? "none"}`,
    () => scheduleReleaseService.listReleases(syId as number, semesterNumber as number),
    { enabled: termKey !== null },
  );

  const releases = useMemo(() => data ?? [], [data]);
  const loading = termKey !== null && data === null;

  const refresh = useCallback(async () => {
    await reload();
  }, [reload]);

  return { releases, loading, refresh };
}
