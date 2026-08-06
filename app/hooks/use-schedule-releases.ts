import { useCallback, useEffect, useState } from "react";
import { scheduleReleaseService } from "~/services/schedule-release.service";
import type { ScheduleRelease } from "~/types/schedule-release";

type UseScheduleReleasesResult = {
  releases: ScheduleRelease[];
  loading: boolean;
  refresh: () => Promise<void>;
};

/** Registrar's schedule releases for one school year + semester, refetched whenever either changes. */
export function useScheduleReleases(
  syId: number | null,
  semesterNumber: number | null,
): UseScheduleReleasesResult {
  const [releases, setReleases] = useState<ScheduleRelease[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (syId == null || semesterNumber == null) {
      setReleases([]);
      return;
    }
    const data = await scheduleReleaseService.listReleases(syId, semesterNumber);
    setReleases(data);
  }, [syId, semesterNumber]);

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch(() => setReleases([]))
      .finally(() => setLoading(false));
  }, [refresh]);

  return { releases, loading, refresh };
}
