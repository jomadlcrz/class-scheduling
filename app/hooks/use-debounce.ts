import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that updates after `delayMs` of inactivity.
 * Useful for deferring expensive filters or API calls while a search input is changing.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
