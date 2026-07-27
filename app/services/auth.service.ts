import { apiPatch, apiPost } from "~/lib/api";
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
  user_id?: number;
  temp_password?: boolean;
  roles?: string[];
  role_labels?: string[];
};

export type LoginResult = AuthSession | { requiresPasswordChange: true };

async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const body = { email: credentials.email, password: credentials.password };
  const data = await apiPost<LoginResponse>("/login", body);

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

// TODO: endpoint not implemented on the backend yet — confirm the path once
// it lands. Gates the reset-password form: any failure (invalid, expired,
// already-used token, or a network error) is treated as "can't proceed".
async function verifyResetToken(token: string): Promise<boolean> {
  try {
    await apiPost("/auth/verify-reset-token", { token });
    return true;
  } catch {
    return false;
  }
}

// TODO: endpoint not implemented on the backend yet — confirm the path once it lands.
async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiPost("/auth/reset-password", { token, newPassword });
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
  verifyResetToken,
  resetPassword,
  changePassword,
};
