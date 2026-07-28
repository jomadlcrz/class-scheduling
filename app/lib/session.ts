import { loadJson, removeJson, saveJson } from "~/lib/storage";
import type { AuthSession } from "~/types/auth";
import type { Role, User } from "~/types/user";

/**
 * Session + JWT helpers for the real backend. Login returns both an access
 * token (short-lived, sent on every request) and a refresh token (long-lived,
 * used only to buy a new access token). The user identity is decoded from the
 * access token's claims, so these helpers own the token → User mapping and the
 * persisted-session lifecycle.
 *
 * The session survives access-token expiry — only an expired or missing refresh
 * token truly kills it. That way, a user who returns after 30+ minutes is still
 * recognised as logged in, and the first API call triggers a transparent refresh.
 */

const SESSION_KEY = "gwc-session";
const PENDING_KEY = "gwc-pending-password-change";

/** Claims embedded in the backend's access token. */
export type TokenPayload = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  /** Backend RoleName enum names, e.g. "SUPER_ADMIN". */
  roles: string[];
  permissions: string[];
  department_id: number | null;
  instructor_id: number | null;
  student_profile_id: number | null;
  exp: number;
};

/** Claims embedded in the backend's refresh token (minimal — only used for expiry). */
type RefreshTokenPayload = {
  user_id: number;
  remember: boolean;
  exp: number;
};

/** Backend RoleName enum names → frontend roles. */
const ROLE_MAP: Record<string, Role> = {
  SUPER_ADMIN: "admin",
  REGISTRAR_ADMIN: "registrar",
  DEAN: "dean",
  INSTRUCTOR: "faculty",
  STUDENT: "student",
};

/** Decodes any JWT payload without verifying it (the backend verifies). */
function decodeTokenPayload<T>(token: string): T | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as T;
  } catch {
    return null;
  }
}

function isExpired(payload: { exp: number }): boolean {
  return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
}

/** Builds the app User from token claims; null when the token is unreadable. */
export function userFromToken(token: string): User | null {
  const payload = decodeTokenPayload<TokenPayload>(token);
  if (!payload) return null;
  const role = payload.roles?.map((name) => ROLE_MAP[name]).find(Boolean);
  if (!role) return null;
  return {
    id: String(payload.user_id),
    name: `${payload.first_name} ${payload.last_name}`.trim(),
    firstName: payload.first_name ?? "",
    lastName: payload.last_name ?? "",
    email: payload.email,
    role,
    // The backend refuses inactive logins, so having a token implies active.
    status: "active",
    // A temp password never yields a token, so it is always resolved here.
    mustChangePassword: false,
    ...(payload.instructor_id != null && { facultyId: String(payload.instructor_id) }),
    ...(payload.student_profile_id != null && { studentId: String(payload.student_profile_id) }),
  };
}

/** Persisted session, or null during SSR, when logged out, or once the REFRESH token expires. */
export function loadSession(): AuthSession | null {
  const session = loadJson<AuthSession>(SESSION_KEY);
  if (!session) return null;

  // Check the refresh token first. New sessions carry one; old sessions don't.
  if (session.refreshToken) {
    const refreshPayload = decodeTokenPayload<RefreshTokenPayload>(session.refreshToken);
    if (!refreshPayload || isExpired(refreshPayload)) {
      removeJson(SESSION_KEY);
      return null;
    }
  } else {
    // Backward compat: old sessions stored before the refresh-token change.
    // Fall back to checking the access token. When it expires, the next API
    // call gets a 401 and the refresh interceptor finds no refreshToken → logout.
    const payload = decodeTokenPayload<TokenPayload>(session.token as string);
    if (!payload || isExpired(payload)) {
      removeJson(SESSION_KEY);
      return null;
    }
  }

  // Rebuild the user from access-token claims so sessions persisted before a User
  // shape change never surface a stale object.
  const user = userFromToken(session.token);
  return user ? { ...session, user } : session;
}

export function saveSession(session: AuthSession, remember: boolean) {
  saveJson(SESSION_KEY, session, { session: !remember });
}

/** Updates the tokens in storage after a successful refresh, keeping the same storage type. */
export function updateSessionTokens(accessToken: string, refreshToken: string): void {
  const session = loadJson<AuthSession>(SESSION_KEY);
  if (!session) return;
  // Preserve the original storage location (localStorage vs sessionStorage)
  const remembered = typeof window !== "undefined" && window.localStorage.getItem(SESSION_KEY) !== null;
  saveJson(
    SESSION_KEY,
    { ...session, token: accessToken, refreshToken },
    { session: !remembered },
  );
}

export function clearSession() {
  removeJson(SESSION_KEY);
}

/** Whether the session lives in localStorage ("remember me") vs sessionStorage. */
export function isRemembered(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

/** First-login state: no token is issued until the temp password is changed. */
export type PendingPasswordChange = { userId: number; remember: boolean };

export function savePending(pending: PendingPasswordChange) {
  saveJson(PENDING_KEY, pending, { session: true });
}

export function getPending(): PendingPasswordChange | null {
  return loadJson<PendingPasswordChange>(PENDING_KEY);
}

export function clearPending() {
  removeJson(PENDING_KEY);
}