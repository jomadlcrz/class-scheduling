import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router";

/**
 * Warns before losing unsaved work: native beforeunload prompt, a styled dialog for
 * in-app keyboard reloads (F5/Ctrl+R), and a react-router blocker for in-app navigation.
 * Callers render their own ConfirmDialog for both the blocker and the reload prompt.
 */
export function useUnsavedChangesGuard(isDirty: boolean, canLeave: boolean) {
  const [reloadPromptOpen, setReloadPromptOpen] = useState(false);
  const reloadConfirmed = useRef(false);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (reloadConfirmed.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const isReload =
        e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r");
      if (!isReload) return;
      e.preventDefault();
      setReloadPromptOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDirty]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && canLeave && currentLocation.pathname !== nextLocation.pathname,
  );

  function confirmReload() {
    reloadConfirmed.current = true;
    window.location.reload();
  }

  return { blocker, reloadPromptOpen, setReloadPromptOpen, confirmReload };
}
