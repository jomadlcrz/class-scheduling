import { useCallback, useEffect, useState } from "react";
import { termClosureService } from "~/services/term-closure.service";
import type { ClosureEffect, TermClosureItem } from "~/types/term-closure";

type UseTermClosuresResult = {
  closures: TermClosureItem[];
  closureEffects: ClosureEffect[];
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useTermClosures(): UseTermClosuresResult {
  const [closures, setClosures] = useState<TermClosureItem[]>([]);
  const [closureEffects, setClosureEffects] = useState<ClosureEffect[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await termClosureService.listClosures();
    setClosures(data.items);
    setClosureEffects(data.closureEffects);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => {
        setClosures([]);
        setClosureEffects([]);
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  return { closures, closureEffects, loading, refresh };
}
