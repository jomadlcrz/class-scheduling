import { useCallback, useEffect, useRef, useState } from "react";
import { scheduleReleaseService } from "~/services/schedule-release.service";
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
 * starting (which made the overview spinner appear intermittently).
 */
export function useScheduleReleases(
  syId: number | null,
  semesterNumber: number | null,
): UseScheduleReleasesResult {
  const [releases, setReleases] = useState<ScheduleRelease[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const termKey = syId != null && semesterNumber != null ? `${syId}:${semesterNumber}` : null;
  const loading = termKey !== null && termKey !== loadedKey;

  // Guards against a slower response for an earlier term overwriting the current one.
  const currentKeyRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (syId == null || semesterNumber == null) {
      setReleases([]);
      setLoadedKey(null);
      return;
    }
    const key = `${syId}:${semesterNumber}`;
    currentKeyRef.current = key;
    try {
      const data = await scheduleReleaseService.listReleases(syId, semesterNumber);
      if (currentKeyRef.current !== key) return;
      setReleases(data);
      setLoadedKey(key);
    } catch {
      if (currentKeyRef.current !== key) return;
      setReleases([]);
      setLoadedKey(key);
    }
  }, [syId, semesterNumber]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { releases, loading, refresh };
}
