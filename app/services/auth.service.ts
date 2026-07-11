import { ApiError, apiPatch, apiPost } from "~/lib/api";
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
 * Auth service backed by the real API. Login is per-role on the backend
 * (five portal endpoints); the frontend keeps a single form by retrying
 * the endpoint named in the 403 wrong-portal response. Other services
 * are still mocked — only auth talks to the backend.
 */

/** Backend RoleName enum names → their login endpoints. */
const LOGIN_ENDPOINTS: Record<string, string> = {
  SUPER_ADMIN: "/super-admin/login",
  REGISTRAR_ADMIN: "/registrar-admin/login",
  DEAN: "/deans/login",
  FACULTY: "/faculty/login",
  STUDENT: "/students/login",
};

type LoginResponse = {
  access_token?: string;
  user_id?: number;
  temp_password?: boolean;
};

export type LoginResult = AuthSession | { requiresPasswordChange: true };

/** The endpoint for the user's actual role, from a 403 wrong-portal response. */
function endpointFromWrongPortal(err: unknown): string | null {
  if (!(err instanceof ApiError) || err.status !== 403) return null;
  const roles = err.details?.role;
  if (!Array.isArray(roles)) return null;
  for (const role of roles) {
    const endpoint = LOGIN_ENDPOINTS[role as string];
    if (endpoint) return endpoint;
  }
  return null;
}

async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const body = { email: credentials.email, password: credentials.password };

  let data: LoginResponse;
  try {
    data = await apiPost<LoginResponse>(LOGIN_ENDPOINTS.STUDENT, body);
  } catch (err) {
    const endpoint = endpointFromWrongPortal(err);
    if (!endpoint) throw err;
    data = await apiPost<LoginResponse>(endpoint, body);
  }

  // First login with a temp password: no token is issued — the user must
  // set a new password before a session exists (see changePassword).
  if (data.temp_password && data.user_id != null) {
    savePending({ userId: data.user_id, remember: Boolean(credentials.remember) });
    return { requiresPasswordChange: true };
  }

  const user = data.access_token ? userFromToken(data.access_token) : null;
  if (!data.access_token || !user) {
    throw new Error("Login failed: unexpected response from the server.");
  }

  const session: AuthSession = { token: data.access_token, user };
  saveSession(session, Boolean(credentials.remember));
  return session;
}

function logout() {
  // Best-effort server-side revocation; the token must still be in storage
  // when the request is built, so fire it before clearing.
  if (loadSession()) {
    void apiPost("/user/logout").catch(() => {});
  }
  clearSession();
  clearPending();
}

/** Synchronous read of the persisted session; null during SSR, logged out, or expired. */
function getStoredSession(): AuthSession | null {
  return loadSession();
}

// TODO: endpoint not implemented on the backend yet — confirm the path once
// it lands. Follows the gwc-portal convention (POST /auth/forgot-password).
async function requestPasswordReset(email: string): Promise<void> {
  await apiPost("/auth/forgot-password", { email });
}

async function changePassword(newPassword: string, _currentPassword?: string): Promise<void> {
  const session = loadSession();
  const pending = getPending();
  const userId = session ? Number(session.user.id) : pending?.userId;
  if (userId == null || Number.isNaN(userId)) {
    throw new Error("You must be logged in to change your password.");
  }

  // The backend validates the password policy and issues a fresh token;
  // it does not check the current password, so it is not sent.
  const data = await apiPatch<{ access_token: string }>(`/user/password/${userId}`, {
    newPassword,
  });

  const user = userFromToken(data.access_token);
  if (user) {
    saveSession(
      { token: data.access_token, user },
      session ? isRemembered() : (pending?.remember ?? false),
    );
  }
  clearPending();
}

export const authService = {
  login,
  logout,
  getStoredSession,
  requestPasswordReset,
  changePassword,
};
