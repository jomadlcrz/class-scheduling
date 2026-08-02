import { useCallback, useEffect, useState } from "react";
import { termClosureService } from "~/services/term-closure.service";
import type { TermClosureItem } from "~/types/term-closure";

type UseTermClosuresResult = {
  closures: TermClosureItem[];
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useTermClosures(): UseTermClosuresResult {
  const [closures, setClosures] = useState<TermClosureItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await termClosureService.listClosures();
    setClosures(data);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setClosures([]))
      .finally(() => setLoading(false));
  }, [refresh]);

  return { closures, loading, refresh };
}
