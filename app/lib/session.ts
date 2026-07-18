import { loadJson, removeJson, saveJson } from "~/lib/storage";
import type { AuthSession } from "~/types/auth";
import type { Role, User } from "~/types/user";

/**
 * Session + JWT helpers for the real backend. Login only returns an access
 * token — the user identity is decoded from its claims, so these helpers
 * own the token → User mapping and the persisted-session lifecycle.
 */

const SESSION_KEY = "gwc-session";
const PENDING_KEY = "gwc-pending-password-change";

/** Claims embedded in the backend's access token. */
type TokenPayload = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  /** Backend RoleName enum names, e.g. "SUPER_ADMIN". */
  roles: string[];
  permissions: string[];
  department_id: number | null;
  faculty_id: number | null;
  student_info_id: number | null;
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

/** Decodes the JWT payload without verifying it (the backend verifies). */
function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as TokenPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: TokenPayload): boolean {
  return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
}

/** Builds the app User from token claims; null when the token is unreadable. */
export function userFromToken(token: string): User | null {
  const payload = decodeTokenPayload(token);
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
    ...(payload.faculty_id != null && { facultyId: String(payload.faculty_id) }),
    ...(payload.student_info_id != null && { studentId: String(payload.student_info_id) }),
  };
}

/** Persisted session, or null during SSR, when logged out, or once the token expires. */
export function loadSession(): AuthSession | null {
  const session = loadJson<AuthSession>(SESSION_KEY);
  if (!session) return null;
  const payload = decodeTokenPayload(session.token);
  if (!payload || isExpired(payload)) {
    removeJson(SESSION_KEY);
    return null;
  }
  // Rebuild the user from token claims so sessions persisted before a User
  // shape change never surface a stale object.
  const user = userFromToken(session.token);
  return user ? { ...session, user } : session;
}

export function saveSession(session: AuthSession, remember: boolean) {
  saveJson(SESSION_KEY, session, { session: !remember });
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
