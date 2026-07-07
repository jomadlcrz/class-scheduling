import { loadJson, removeJson, saveJson } from "~/lib/storage";
import type { AuthSession, LoginCredentials } from "~/types/auth";
import { accounts, delay, toUser } from "~/services/mock-data";

/**
 * MOCK auth service — no backend yet. Accounts live in the shared
 * in-memory store (see mock-data.ts for demo credentials) and the
 * session persists to browser storage, so the full login/logout and
 * password flows work end-to-end in the UI. Swap the internals for real
 * API calls later; the exported surface must stay the same.
 */

const SESSION_KEY = "gwc-session";

async function login(credentials: LoginCredentials): Promise<AuthSession> {
  await delay();
  const account = accounts.find(
    (a) => a.email.toLowerCase() === credentials.email.toLowerCase(),
  );
  if (!account || account.password !== credentials.password) {
    throw new Error("Invalid email or password.");
  }
  if (account.status === "inactive") {
    throw new Error("Your account has been deactivated. Contact your administrator.");
  }

  const session: AuthSession = {
    token: `mock-token-${account.id}-${Date.now()}`,
    user: toUser(account),
  };
  saveJson(SESSION_KEY, session, { session: !credentials.remember });
  return session;
}

function logout() {
  removeJson(SESSION_KEY);
}

/** Synchronous read of the persisted session; null during SSR or when logged out. */
function getStoredSession(): AuthSession | null {
  return loadJson<AuthSession>(SESSION_KEY);
}

/** Always resolves — a real backend must not reveal whether the email is registered. */
async function requestPasswordReset(_email: string): Promise<void> {
  await delay();
}

/** Mock accepts any non-empty token; the route already rejects missing tokens. */
async function resetPassword(_token: string, _newPassword: string): Promise<void> {
  await delay();
}

async function changePassword(newPassword: string, currentPassword?: string): Promise<void> {
  await delay();
  const session = getStoredSession();
  if (!session) {
    throw new Error("You must be logged in to change your password.");
  }

  const account = accounts.find((a) => a.id === session.user.id);
  if (!account) {
    throw new Error("You must be logged in to change your password.");
  }

  // Forced first-login flow: the user just authenticated, so the fresh
  // session authorizes the change — no current password re-entry.
  if (!account.mustChangePassword) {
    if (!currentPassword || account.password !== currentPassword) {
      throw new Error("Current password is incorrect.");
    }
  }
  if (newPassword === account.password) {
    throw new Error("New password must be different from your current password.");
  }

  // In-memory only — resets on reload, which is fine for a mock.
  account.password = newPassword;
  account.mustChangePassword = false;
  saveJson(SESSION_KEY, { ...session, user: toUser(account) }, { session: !isRemembered() });
}

/** Whether the session lives in localStorage ("remember me") vs sessionStorage. */
function isRemembered(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

export const authService = {
  login,
  logout,
  getStoredSession,
  requestPasswordReset,
  resetPassword,
  changePassword,
};
