import { AUTH_STATE_CHANGED_EVENT } from "~/lib/cross-tab-sync";
import { clearSession, loadSession, updateSessionTokens } from "~/lib/session";

/**
 * Fetch wrapper for the backend API. Prepends VITE_API_URL (which already
 * includes /api/v1), attaches the Bearer token from the stored session, and
 * normalizes error payloads into ApiError so the UI can show err.message
 * directly. The backend is inconsistent across modules — { error }, { message },
 * or { errors } holding a string, a list, or a field → messages dict — so the
 * first message found is surfaced verbatim.
 *
 * ON 401 — Automatically attempts a token refresh before clearing the session.
 * Only one refresh request is in-flight at a time; concurrent 401s queue behind
 * it and retry once on success.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const REFRESH_ENDPOINT = "/refresh";

// ── Client response cache ──────────────────────────────────────────────────
// Mirrors the backend's Redis GET cache (app/utils/cache.py, 60s TTL): GET
// bodies are kept in memory per user, and any successful mutation clears the
// whole cache so reads never serve data a write just changed. Client-only —
// SSR requests and the refresh path bypass it. The backend is the invalidation
// source of truth; the short TTL bounds staleness from other users' writes.

const GET_CACHE_TTL_MS = 60_000;
const getCache = new Map<string, { data: unknown; expiresAt: number }>();

function cacheKey(endpoint: string): string {
  const userId = loadSession()?.user?.id;
  return `${userId ?? "anon"}:${resolveApiUrl(endpoint)}`;
}

function cacheRead<T>(endpoint: string): T | null {
  if (typeof window === "undefined") return null;
  const key = cacheKey(endpoint);
  const entry = getCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    getCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheWrite(endpoint: string, data: unknown): void {
  if (typeof window === "undefined") return;
  getCache.set(cacheKey(endpoint), { data, expiresAt: Date.now() + GET_CACHE_TTL_MS });
}

/** Clears every cached GET — called after any successful mutation and on logout. */
export function clearApiCache(): void {
  getCache.clear();
}

export class ApiError extends Error {
  status: number;
  details: Record<string, unknown> | null;

  constructor(message: string, status: number, details: Record<string, unknown> | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function resolveApiUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return `${API_BASE}${endpoint}`;
}

/**
 * Notifies the auth provider that the persisted session may have changed
 * (e.g. it was replaced by another tab) so it can re-read and re-render.
 */
function notifyAuthStateChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT));
}

/** Digs the first human-readable string out of a backend error payload. */
function firstMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstMessage(item);
      if (message) return message;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const message = firstMessage(item);
      if (message) return message;
    }
  }
  return null;
}

// ── Refresh-token dedup ────────────────────────────────────────────────────
// Only one refresh request is in-flight at a time. Concurrent callers wait on
// the same promise and retry once when it resolves successfully.
let refreshPromise: Promise<RefreshResult> | null = null;

type RefreshResult =
  | { ok: true }
  | { ok: false; backendMessage?: string };

/**
 * Attempts to refresh the access token using the stored refresh token.
 * Returns `{ ok: true }` on success, or `{ ok: false, backendMessage? }`
 * when the session is dead (the backend's error message is surfaced verbatim).
 */
async function attemptRefresh(): Promise<RefreshResult> {
  // If a refresh is already in-flight, wait for it.
  if (refreshPromise) return refreshPromise;

  refreshPromise = doRefresh();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function doRefresh(): Promise<RefreshResult> {
  const session = loadSession();
  if (!session?.refreshToken) return { ok: false };

  try {
    const response = await fetch(resolveApiUrl(REFRESH_ENDPOINT), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Note: no Authorization header — the access token may be expired.
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!response.ok) {
      // Read the backend's error message verbatim.
      const errData = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      const backendMessage =
        firstMessage(errData?.error) ??
        firstMessage(errData?.errors) ??
        firstMessage(errData?.message) ??
        undefined;
      clearSession();
      return { ok: false, backendMessage };
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
    } | null;

    if (!data?.access_token || !data?.refresh_token) {
      clearSession();
      return { ok: false };
    }

    updateSessionTokens(data.access_token, data.refresh_token);
    return { ok: true };
  } catch {
    // Network error during refresh — don't clear the session, the attempt may
    // succeed when connectivity returns. The original request already failed.
    return { ok: false };
  }
}

// ── Core request ───────────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  // Skip the refresh loop for the refresh endpoint itself.
  const isRefreshCall = endpoint === REFRESH_ENDPOINT;

  const token = loadSession()?.token;
  const requestHeaders: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };

  let response: Response;
  try {
    response = await fetch(resolveApiUrl(endpoint), {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0);
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  notifyAuthStateChange();

  // ── 401 → attempt refresh and retry once ──
  if (response.status === 401 && token && !isRefreshCall) {
    const result = await attemptRefresh();
    if (result.ok) {
      // The refresh rotated the refresh token. If this body names one (logout),
      // point it at the live token — otherwise the server revokes the rotated-away
      // copy and the replacement escapes.
      let retryBody = body;
      if (
        body !== null &&
        typeof body === "object" &&
        !Array.isArray(body) &&
        "refreshToken" in body
      ) {
        const liveRefresh = loadSession()?.refreshToken;
        if (liveRefresh) {
          retryBody = { ...(body as Record<string, unknown>), refreshToken: liveRefresh };
        }
      }
      // Retry the original request with the new token.
      const newToken = loadSession()?.token;
      const retryHeaders: Record<string, string> = {
        ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
        ...(retryBody !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      };

      let retryResponse: Response;
      try {
        retryResponse = await fetch(resolveApiUrl(endpoint), {
          method,
          headers: retryHeaders,
          body: retryBody !== undefined ? JSON.stringify(retryBody) : undefined,
        });
      } catch {
        throw new ApiError("Unable to reach the server. Check your connection and try again.", 0);
      }

      const retryData = (await retryResponse.json().catch(() => null)) as Record<string, unknown> | null;

      if (retryResponse.ok) {
        if (method !== "GET") clearApiCache();
        return retryData as T;
      }

      // Retry also failed — surface the backend's message verbatim.
      if (retryResponse.status === 401 && newToken) clearSession();
      const retryMessage =
        firstMessage(retryData?.error) ??
        firstMessage(retryData?.errors) ??
        firstMessage(retryData?.message) ??
        "Something went wrong. Please try again.";
      throw new ApiError(retryMessage, retryResponse.status, retryData);
    }

    // Refresh failed — session is dead. Use the refresh endpoint's own message.
    clearSession();
    notifyAuthStateChange();
    throw new ApiError(
      result.backendMessage ?? "Something went wrong. Please try again.",
      response.status,
      data,
    );
  }

  if (!response.ok) {
    if (response.status === 401 && token) clearSession();
    const message =
      firstMessage(data?.error) ??
      firstMessage(data?.errors) ??
      firstMessage(data?.message) ??
      "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, data);
  }

  if (method !== "GET") clearApiCache();
  return data as T;
}
/** Surfaces a mutation response's backend message verbatim; empty string when the response has none. */
export function apiMessage(data: { message?: unknown } | null | undefined): string {
  return typeof data?.message === "string" ? data.message.trim() : "";
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const cached = cacheRead<T>(endpoint);
  if (cached !== null) return cached;
  const data = await request<T>(endpoint, "GET");
  cacheWrite(endpoint, data);
  return data;
}

export function apiPost<T>(
  endpoint: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  return request<T>(endpoint, "POST", body, headers);
}

export function apiPatch<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, "PATCH", body);
}

export function apiPut<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, "PUT", body);
}

export function apiDelete<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, "DELETE", body);
}

/** POST a FormData (file upload) — lets the browser set the multipart boundary. */
export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = loadSession()?.token;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  let response: Response;
  try {
    response = await fetch(resolveApiUrl(endpoint), {
      method: "POST",
      headers,
      body: formData,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0);
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  notifyAuthStateChange();

  // ── 401 → attempt refresh and retry once ──
  if (response.status === 401 && token) {
    const result = await attemptRefresh();
    if (result.ok) {
      const newToken = loadSession()?.token;
      const retryHeaders: Record<string, string> = newToken ? { Authorization: `Bearer ${newToken}` } : {};

      let retryResponse: Response;
      try {
        retryResponse = await fetch(resolveApiUrl(endpoint), {
          method: "POST",
          headers: retryHeaders,
          body: formData,
        });
      } catch {
        throw new ApiError("Unable to reach the server. Check your connection and try again.", 0);
      }

      const retryData = (await retryResponse.json().catch(() => null)) as Record<string, unknown> | null;

      if (retryResponse.ok) {
        clearApiCache();
        return retryData as T;
      }

      if (retryResponse.status === 401 && newToken) clearSession();
      const retryMessage =
        firstMessage(retryData?.error) ??
        firstMessage(retryData?.errors) ??
        firstMessage(retryData?.message) ??
        "Something went wrong. Please try again.";
      throw new ApiError(retryMessage, retryResponse.status, retryData);
    }

    // Refresh failed — use the refresh endpoint's own message.
    clearSession();
    notifyAuthStateChange();
    throw new ApiError(
      result.backendMessage ?? "Something went wrong. Please try again.",
      response.status,
      data,
    );
  }

  if (!response.ok) {
    if (response.status === 401 && token) clearSession();
    const message =
      firstMessage(data?.error) ??
      firstMessage(data?.errors) ??
      firstMessage(data?.message) ??
      "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, data);
  }

  clearApiCache();
  return data as T;
}

