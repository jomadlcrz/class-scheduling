import { clearSession, loadSession } from "~/lib/session";

/**
 * Fetch wrapper for the backend API. Prepends VITE_API_URL (which already
 * includes /api/v1), attaches the Bearer token from the stored session, and
 * normalizes error payloads — the backend responds with either { error } or
 * { message } — into ApiError so the UI can show err.message directly.
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = loadSession()?.token;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0);
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    // An authenticated call rejected with 401 means the session is no
    // longer valid (expired or revoked) — drop it so guards log the user out.
    if (response.status === 401 && token) clearSession();
    const message =
      (typeof data?.error === "string" && data.error) ||
      (typeof data?.message === "string" && data.message) ||
      "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPatch<T>(endpoint: string, body: unknown): Promise<T> {
  return request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) });
}
