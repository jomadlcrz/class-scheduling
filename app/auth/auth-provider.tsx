import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Storage is client-only, so the session is restored after hydration.
  useEffect(() => {
    setUser(authService.getStoredSession()?.user ?? null);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials);
    // Temp-password logins produce no session yet — the user isn't
    // authenticated until they set a new password.
    if ("user" in result) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

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
