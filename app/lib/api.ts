import { clearSession, loadSession } from "~/lib/session";

/**
 * Fetch wrapper for the backend API. Prepends VITE_API_URL (which already
 * includes /api/v1), attaches the Bearer token from the stored session, and
 * normalizes error payloads into ApiError so the UI can show err.message
 * directly. The backend is inconsistent across modules — { error }, { message },
 * or { errors } holding a string, a list, or a field → messages dict — so the
 * first message found is surfaced verbatim.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

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

async function request<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
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

  if (!response.ok) {
    // An authenticated call rejected with 401 means the session is no
    // longer valid (expired or revoked) — drop it so guards log the user out.
    if (response.status === 401 && token) clearSession();
    const message =
      firstMessage(data?.error) ??
      firstMessage(data?.errors) ??
      firstMessage(data?.message) ??
      "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

/** Surfaces a mutation response's backend message verbatim; empty string when the response has none. */
export function apiMessage(data: { message?: unknown } | null | undefined): string {
  return typeof data?.message === "string" ? data.message.trim() : "";
}

export function apiGet<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, "GET");
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

  if (!response.ok) {
    if (response.status === 401 && token) clearSession();
    const message =
      firstMessage(data?.error) ??
      firstMessage(data?.errors) ??
      firstMessage(data?.message) ??
      "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

const toSnakeKey = (value: string): string =>
  value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

/** Recursively snake_case object keys — the backend mixes camelCase and snake_case responses. */
function normalizeResponseKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeResponseKeys(item)) as T;
  }
  if (!value || Object.prototype.toString.call(value) !== "[object Object]") {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      toSnakeKey(key),
      normalizeResponseKeys(entry),
    ]),
  ) as T;
}
