import { SESSION_KEY } from "~/lib/session";

/**
 * Cross-tab auth-sync transport. Announces auth changes (login/logout) made in
 * one tab to every other open tab of this origin, and re-delivers announcements
 * made elsewhere.
 *
 * Transport (in order of preference):
 *  - BroadcastChannel when supported. postMessage never echoes back to the
 *    sender, so there is no self-loop by construction.
 *  - A localStorage "marker" write otherwise, observed by other tabs through
 *    the `storage` event. The marker is always written, which also covers
 *    sessionStorage-only sessions (those never fire `storage` on their own)
 *    and mixed-browser tabs where one side lacks BroadcastChannel.
 *  - The real session key (`gwc-session`) is watched as a safety net for
 *    writes that bypass broadcast() (auth flows that save storage directly).
 *
 * Loop protection:
 *  - The tab that performs the change never receives its own announcement.
 *  - Receivers never write to storage or broadcast, so a notification can
 *    never cascade back into another notification.
 *  - Every announcement carries a unique eventId; the same id delivered via
 *    both BroadcastChannel and the storage fallback is processed once.
 */

export type AuthSyncKind = "login" | "logout";

type AuthSyncMessage = {
  kind: AuthSyncKind;
  eventId: string;
};

/** Dispatched after an API request so providers can re-read the persisted session. */
export const AUTH_STATE_CHANGED_EVENT = "gwc:auth-state-changed";

const CHANNEL_NAME = "gwc-auth-sync";
const MARKER_KEY = "gwc-auth-sync";

type Handler = (message: AuthSyncMessage) => void;

const handlers = new Set<Handler>();
const recentEventIds = new Set<string>();
const MAX_RECENT_EVENT_IDS = 100;

let channel: BroadcastChannel | null = null;
let transportAttached = false;

const isBrowser = typeof window !== "undefined";

function supportsBroadcastChannel(): boolean {
  return typeof BroadcastChannel !== "undefined";
}

function createEventId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function isValidMessage(value: unknown): value is AuthSyncMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<AuthSyncMessage>;
  return (
    (message.kind === "login" || message.kind === "logout") &&
    typeof message.eventId === "string"
  );
}

function writeMarker(message: AuthSyncMessage) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(MARKER_KEY, JSON.stringify(message));
  } catch {
    // Private mode / quota — the BroadcastChannel path still works where supported.
  }
}

function parseMarker(raw: string | null): AuthSyncMessage | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidMessage(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Routes a message once, even when the same eventId arrives over multiple transports. */
function deliver(message: AuthSyncMessage) {
  if (recentEventIds.has(message.eventId)) return;
  if (recentEventIds.size >= MAX_RECENT_EVENT_IDS) {
    const oldest = recentEventIds.values().next().value as string;
    recentEventIds.delete(oldest);
  }
  recentEventIds.add(message.eventId);
  for (const handler of handlers) handler(message);
}

function handleStorage(event: StorageEvent) {
  if (event.key === MARKER_KEY) {
    const message = parseMarker(event.newValue);
    if (message) deliver(message);
    return;
  }
  // Safety net for session writes that bypass broadcast(): infer login/logout
  // from the session key itself. Consumers treat it idempotently, so the
  // duplicate is harmless when the marker already carried the same change.
  if (event.key === SESSION_KEY) {
    deliver({ kind: event.newValue ? "login" : "logout", eventId: createEventId() });
  }
}

function attachTransport() {
  if (transportAttached || !isBrowser) return;
  transportAttached = true;

  if (supportsBroadcastChannel()) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent) => {
        if (isValidMessage(event.data)) deliver(event.data);
      };
    } catch {
      // BroadcastChannel unavailable — the storage fallback covers the tab.
      channel = null;
    }
  }

  window.addEventListener("storage", handleStorage);
}

function detachTransport() {
  if (!transportAttached) return;
  transportAttached = false;
  channel?.close();
  channel = null;
  window.removeEventListener("storage", handleStorage);
}

/** Announces an auth change to every other tab. */
export function broadcast(kind: AuthSyncKind): void {
  const message: AuthSyncMessage = { kind, eventId: createEventId() };
  if (supportsBroadcastChannel() && channel) {
    try {
      channel.postMessage(message);
    } catch {
      // Channel unavailable (rare private-mode case) — fall through to storage.
    }
  }
  writeMarker(message);
}

/** Registers a handler for auth changes made in other tabs. Returns an unsubscribe function. */
export function subscribe(handler: Handler): () => void {
  handlers.add(handler);
  attachTransport();
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) detachTransport();
  };
}
