import { useMemo } from "react";
import {
  allApproved as computeAllApproved,
  deriveHubStage,
  tallyStatuses,
  type HubStage,
  type StatusCounts,
} from "~/features/schedules/hub/scheduling-stages";
import { useCachedData } from "~/hooks/use-cached-data";
import { useScheduleReleases } from "~/hooks/use-schedule-releases";
import { setService } from "~/services/set.service";

export type SchedulingHubData = {
  loading: boolean;
  hasTerm: boolean;
  total: number;
  built: number;
  unscheduled: number;
  counts: StatusCounts;
  stage: HubStage;
  allApproved: boolean;
};

/**
 * Composes the scheduling hub's status entirely from existing services — release statuses
 * for the term plus the term's section totals (all vs. unscheduled). No new backend.
 */
export function useSchedulingHubData(
  syId: number | null,
  semesterNumber: number | null,
): SchedulingHubData {
  const enabled = syId != null && semesterNumber != null;
  const termKey = enabled ? `${syId}:${semesterNumber}` : "none";

  const { releases, loading: releasesLoading } = useScheduleReleases(syId, semesterNumber);

  const { data: setsData } = useCachedData(
    `hub-sets:${termKey}`,
    () => setService.list({ syId: syId as number, semesterNumber: semesterNumber as number }),
    { enabled },
  );
  const { data: unscheduledData } = useCachedData(
    `hub-unscheduled:${termKey}`,
    () => setService.listUnscheduled({ syId: syId as number, semesterNumber: semesterNumber as number }),
    { enabled },
  );

  const counts = useMemo(() => tallyStatuses(releases.map((r) => r.releaseStatus)), [releases]);
  const total = setsData?.length ?? 0;
  const unscheduled = unscheduledData?.length ?? 0;
  const built = Math.max(total - unscheduled, 0);

  const setsLoading = enabled && (setsData === null || unscheduledData === null);
  const loading = enabled && (releasesLoading || setsLoading);

  const stage = useMemo(
    () => deriveHubStage({ hasTerm: enabled, total, unscheduled, counts }),
    [enabled, total, unscheduled, counts],
  );

  return {
    loading,
    hasTerm: enabled,
    total,
    built,
    unscheduled,
    counts,
    stage,
    allApproved: computeAllApproved(total, counts),
  };
}
