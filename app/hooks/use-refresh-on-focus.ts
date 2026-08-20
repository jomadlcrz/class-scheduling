import { useEffect, useRef } from "react";

/** Revalidates route data when an already-open app tab becomes active again. */
export function useRefreshOnFocus(refresh: () => void | Promise<void>, enabled = true) {
  const refreshRef = useRef(refresh);
  const enabledRef = useRef(enabled);
  const refreshingRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    function revalidate() {
      if (!enabledRef.current || refreshingRef.current) return;
      refreshingRef.current = true;
      void Promise.resolve()
        .then(() => refreshRef.current())
        .finally(() => {
          refreshingRef.current = false;
        });
    }

    function revalidateWhenVisible() {
      if (document.visibilityState === "visible") revalidate();
    }

    window.addEventListener("focus", revalidate);
    window.addEventListener("pageshow", revalidate);
    document.addEventListener("visibilitychange", revalidateWhenVisible);

    return () => {
      window.removeEventListener("focus", revalidate);
      window.removeEventListener("pageshow", revalidate);
      document.removeEventListener("visibilitychange", revalidateWhenVisible);
    };
  }, []);
}
