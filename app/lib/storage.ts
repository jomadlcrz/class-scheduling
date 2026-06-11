/**
 * Safe browser-storage helpers: no-ops during SSR and swallow storage
 * failures (private mode, quota), so callers never need try/catch.
 */

const isBrowser = typeof window !== "undefined";

/** Reads a JSON value, checking localStorage first, then sessionStorage. */
export function loadJson<T>(key: string): T | null {
  if (!isBrowser) return null;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = store.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // Unreadable or corrupt entry — fall through to the next store.
    }
  }
  return null;
}

export function saveJson(key: string, value: unknown, options?: { session?: boolean }) {
  if (!isBrowser) return;
  try {
    const store = options?.session ? window.sessionStorage : window.localStorage;
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures — callers treat storage as best-effort.
  }
}

/** Removes the key from both stores. */
export function removeJson(key: string) {
  if (!isBrowser) return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      store.removeItem(key);
    } catch {
      // Ignore.
    }
  }
}
