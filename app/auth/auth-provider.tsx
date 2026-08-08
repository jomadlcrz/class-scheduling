import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearDataCache } from "~/lib/data-cache";
import { clearPending, clearSession } from "~/lib/session";
import { useCrossTabAuthSync } from "~/hooks/use-cross-tab-auth-sync";
import { authService, type LoginResult } from "~/services/auth.service";
import type { LoginCredentials } from "~/types/auth";
import type { User } from "~/types/user";

type AuthContextValue = {
  user: User | null;
  /** True until the persisted session has been read on the client (always true during SSR). */
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Same session identity — lets resyncs keep the existing state object so React doesn't re-render. */
function sameUser(a: User | null, b: User | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.email === b.email;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Storage is client-only, so the session is restored after hydration.
  useEffect(() => {
    setUser(authService.getStoredSession()?.user ?? null);
    setIsLoading(false);
  }, []);

  // Reflect whatever the persisted session holds right now (never redirects).
  const resyncSession = useCallback(() => {
    setUser((current) => {
      const next = authService.getStoredSession()?.user ?? null;
      return sameUser(current, next) ? current : next;
    });
  }, []);

  // Another tab logged out: drop this tab's local session (sessionStorage is
  // per-tab, so a non-remembered session here must be cleared by us) and any
  // pending first-login state, then flip to logged out immediately.
  const handleRemoteLogout = useCallback(() => {
    clearSession();
    clearPending();
    clearDataCache();
    setUser(null);
  }, []);

  const { announceLogin, announceLogout } = useCrossTabAuthSync({
    onRemoteLogout: handleRemoteLogout,
    onResync: resyncSession,
  });

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await authService.login(credentials);
      // Temp-password logins produce no session yet — the user isn't
      // authenticated until they set a new password.
      if ("user" in result) {
        setUser(result.user);
        announceLogin();
      }
      return result;
    },
    [announceLogin],
  );

  const logout = useCallback(() => {
    authService.logout();
    clearDataCache();
    setUser(null);
    announceLogout();
  }, [announceLogout]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
