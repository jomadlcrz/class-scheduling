import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import {
  AUTH_STATE_CHANGED_EVENT,
  broadcast,
  subscribe,
} from "~/lib/cross-tab-sync";

type CrossTabAuthSyncOptions = {
  /** Another tab logged out — clear this tab's local auth state immediately. */
  onRemoteLogout: () => void;
  /** Re-read the persisted session and reflect it in state (never redirects). */
  onResync: () => void;
};

/**
 * Keeps auth state in sync across open tabs.
 *
 * - Logout in any tab immediately logs out every other tab (broadcast, no refresh).
 * - Login in any tab leaves the other tabs untouched until the user interacts —
 *   returning to the tab (focus/visibility), navigating, or an authenticated
 *   request — at which point onResync detects the new session and updates state.
 */
export function useCrossTabAuthSync({ onRemoteLogout, onResync }: CrossTabAuthSyncOptions) {
  const callbacksRef = useRef({ onRemoteLogout, onResync });
  callbacksRef.current = { onRemoteLogout, onResync };

  const location = useLocation();

  // ── Incoming: react to auth changes made in other tabs ──
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.kind === "logout") {
        // Logout must propagate immediately and without interaction.
        callbacksRef.current.onRemoteLogout();
      }
      // A login is deliberately NOT applied on arrival: the other tab keeps its
      // current state until the user interacts, when the triggers below resync.
    });
    return unsubscribe;
  }, []);

  // ── Interaction triggers: re-read the session when the user returns to this
  //    tab, or when an authenticated request proves a session exists ──
  useEffect(() => {
    const resync = () => callbacksRef.current.onResync();
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);
    window.addEventListener("pageshow", resync);
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, resync);
    return () => {
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
      window.removeEventListener("pageshow", resync);
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, resync);
    };
  }, []);

  // Navigation is an interaction: resync on every route change.
  useEffect(() => {
    callbacksRef.current.onResync();
  }, [location.key]);

  // ── Outgoing: announce auth changes made by THIS tab ──
  const announceLogin = useCallback(() => broadcast("login"), []);
  const announceLogout = useCallback(() => broadcast("logout"), []);

  return { announceLogin, announceLogout };
}
