/**
 * Persistent client cache for mapped domain data (the shapes components render,
 * not the raw backend bodies cached in app/lib/api.ts). It exists so pages can
 * seed their initial state synchronously and skip the loading skeleton on any
 * subsequent load, and so that a full page reload never resets what the user was
 * already looking at.
 *
 * - Scoped per user (mirrors the api.ts cache key) so no account reads another's data.
 * - Persisted to sessionStorage: survives reloads within the tab, clears on tab close.
 * - No TTL: freshness comes from stale-while-revalidate (callers always refetch on
 *   mount and swap in fresh data); the cache is emptied on logout.
 */

import { loadSession } from "~/lib/session";
import { loadJson, removeJson, saveJson } from "~/lib/storage";

const STORAGE_KEY = "gwc-data-cache";
const isBrowser = typeof window !== "undefined";

type Store = Record<string, unknown>;

// Hydrated once from sessionStorage on module load so the very first render after
// a reload already has data to seed from.
let memory: Store = isBrowser ? loadJson<Store>(STORAGE_KEY) ?? {} : {};

/** Prefixes the caller's key with the current user id, matching api.ts keying. */
function scopedKey(key: string): string {
  const userId = loadSession()?.user?.id;
  return `${userId ?? "anon"}:${key}`;
}

/** Synchronous read of a cached value; null during SSR or on a miss. */
export function peekCache<T>(key: string): T | null {
  if (!isBrowser) return null;
  const value = memory[scopedKey(key)];
  return value === undefined ? null : (value as T);
}

/** Stores a mapped value and persists the whole cache to sessionStorage. */
export function writeCache(key: string, value: unknown): void {
  if (!isBrowser) return;
  memory[scopedKey(key)] = value;
  saveJson(STORAGE_KEY, memory, { session: true });
}

/** Empties the cache (memory + sessionStorage) — called on logout. */
export function clearDataCache(): void {
  memory = {};
  removeJson(STORAGE_KEY);
}
