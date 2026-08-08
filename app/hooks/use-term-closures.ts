import { useCallback, useMemo } from "react";
import { termClosureService } from "~/services/term-closure.service";
import { useCachedData } from "~/hooks/use-cached-data";
import type { ClosureEffect, TermClosureItem } from "~/types/term-closure";

type UseTermClosuresResult = {
  closures: TermClosureItem[];
  closureEffects: ClosureEffect[];
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useTermClosures(): UseTermClosuresResult {
  const { data, reload } = useCachedData("term-closures", () =>
    termClosureService.listClosures(),
  );
  const closures = useMemo(() => data?.items ?? [], [data]);
  const closureEffects = useMemo(() => data?.closureEffects ?? [], [data]);
  const loading = data === null;

  const refresh = useCallback(async () => {
    await reload();
  }, [reload]);

  return { closures, closureEffects, loading, refresh };
}
