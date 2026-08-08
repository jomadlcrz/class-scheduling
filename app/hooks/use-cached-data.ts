import { useCallback, useEffect, useRef, useState } from "react";
import { peekCache, writeCache } from "~/lib/data-cache";

/**
 * Stale-while-revalidate data loader for the app's client-fetched pages.
 *
 * Seeds state synchronously from the persistent data cache, so a page that has
 * data cached (from an earlier visit, or restored from sessionStorage after a
 * reload) renders it immediately with no skeleton. On every mount — and whenever
 * the key changes — it refetches in the background and swaps in fresh data.
 *
 * Safe against hydration mismatches: authenticated pages mount client-only
 * (AuthGuard renders a loading state through SSR and first hydration), and
 * peekCache returns null during SSR regardless.
 *
 * Dynamic keys are supported (e.g. `releases:${syId}:${sem}`): on a key change
 * the hook re-seeds from that key's cache, and a slow response for a key the
 * caller has already navigated away from is written to its own cache slot but
 * never applied to the visible state.
 *
 * Render contract for callers:
 *   data === null && !error  → cold load, show the skeleton
 *   error && data === null    → cold load failed, show the error state
 *   otherwise                 → render data (stale data stays visible while
 *                               a background revalidation runs)
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<T | null>(() => peekCache<T>(key));
  const [error, setError] = useState<string | null>(null);
  // True while a fetch is in flight — lets callers show a subtle "refreshing"
  // indicator when revalidating over already-visible data.
  const [isValidating, setIsValidating] = useState(false);

  // Keep the latest fetcher without making it a reload() dependency — callers
  // routinely pass a fresh closure each render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Tracks the currently-mounted key so a stale in-flight fetch (from a key the
  // caller has since navigated away from) never overwrites the visible state.
  const keyRef = useRef(key);
  keyRef.current = key;

  const reload = useCallback(async () => {
    const callKey = key;
    setIsValidating(true);
    try {
      const fresh = await fetcherRef.current();
      writeCache(callKey, fresh);
      if (keyRef.current !== callKey) return;
      setData(fresh);
      setError(null);
    } catch (err) {
      if (keyRef.current !== callKey) return;
      // Keep any cached data visible; only the error message is updated.
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      if (keyRef.current === callKey) setIsValidating(false);
    }
  }, [key]);

  // Re-seed from cache when the key changes so we show that key's cached data
  // immediately instead of the previous key's stale data.
  useEffect(() => {
    setData(peekCache<T>(key));
    setError(null);
  }, [key]);

  useEffect(() => {
    if (!enabled) return;
    void reload();
  }, [enabled, reload]);

  return { data, error, isValidating, reload, setData };
}
