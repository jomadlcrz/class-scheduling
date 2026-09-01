import { apiDelete, apiMessage, apiPatch, apiPost, clearApiCache } from "~/lib/api";
import {
  clearPending,
  clearSession,
  getPending,
  isRemembered,
  loadSession,
  savePending,
  saveSession,
  userFromToken,
} from "~/lib/session";
import type { AuthSession, LoginCredentials } from "~/types/auth";

/**
 * Auth service backed by the real API. Every role signs in at universal POST /login;
 * the response carries user roles to guide dashboard routing. Other services
 * are still mocked — only auth talks to the backend.
 */

type LoginResponse = {
  access_token?: string;
  refresh_token?: string;
  remember_me?: boolean;
  user_id?: number;
  temp_password?: boolean;
  roles?: string[];
  role_labels?: string[];
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  remember_me: boolean;
  roles: string[];
  role_labels: string[];
};

export type LoginResult = AuthSession | { requiresPasswordChange: true };

async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const body: Record<string, unknown> = { email: credentials.email, password: credentials.password };
  if (credentials.remember) body.rememberMe = true;
  const data = await apiPost<LoginResponse>("/auth/sessions", body);

  // First login with a temp password: no token is issued — the user must
  // set a new password before a session exists (see changePassword).
  if (data.temp_password && data.user_id != null) {
    savePending({ userId: data.user_id, remember: Boolean(credentials.remember) });
    return { requiresPasswordChange: true };
  }

  const user = data.access_token ? userFromToken(data.access_token) : null;
  if (!data.access_token || !data.refresh_token || !user) {
    throw new Error("Login failed: unexpected response from the server.");
  }

  const remember = Boolean(data.remember_me ?? credentials.remember);
  const session: AuthSession = {
    token: data.access_token,
    refreshToken: data.refresh_token,
    remember_me: remember,
    user,
  };
  saveSession(session, remember);
  return session;
}

function logout() {
  // Best-effort server-side revocation; the token must still be in storage
  // when the request is built, so fire it before clearing.
  const session = loadSession();
  if (session) {
    void apiDelete("/auth/sessions/current", { refreshToken: session.refreshToken }).catch(() => {});
  }
  clearSession();
  clearPending();
  clearApiCache();
}

/** Synchronous read of the persisted session; null during SSR, logged out, or expired. */
function getStoredSession(): AuthSession | null {
  return loadSession();
}

/**
 * POST /password-reset-requests — 200 with the same generic message (anti-enumeration),
 * or 429 when the backend's per-email/per-IP rate limit is exceeded (message
 * surfaced verbatim like any other ApiError).
 */
async function requestPasswordReset(email: string): Promise<string> {
  const data = await apiPost<{ message?: string }>("/password-reset-requests", { email });
  return apiMessage(data);
}

/** POST /password-resets — consumes the one-time link; 401 for any token problem. */
async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiPost("/password-resets", { token, newPassword });
}

async function changePassword(newPassword: string, _currentPassword?: string): Promise<void> {
  const session = loadSession();
  const pending = getPending();
  const userId = session ? Number(session.user.id) : pending?.userId;
  if (userId == null || Number.isNaN(userId)) {
    throw new Error("You must be logged in to change your password.");
  }

  // The backend validates the password policy and issues a fresh access+refresh pair;
  // it does not check the current password, so it is not sent.
  const data = await apiPatch<{ access_token: string; refresh_token: string }>(
    `/users/${userId}/password`,
    { newPassword },
  );

  const user = userFromToken(data.access_token);
  if (user) {
    const remember = session ? isRemembered() : (pending?.remember ?? false);
    saveSession(
      {
        token: data.access_token,
        refreshToken: data.refresh_token,
        remember_me: remember,
        user,
      },
      remember,
    );
  }
  clearPending();
}

export const authService = {
  login,
  logout,
  getStoredSession,
  requestPasswordReset,
  resetPassword,
  changePassword,
};