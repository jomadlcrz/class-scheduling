import { loadSession } from "~/lib/session";
import type { NotificationItem, NotificationType } from "~/types/notification";

/**
 * Live notification stream (WebSocket) — the push half of the inbox.
 *
 * The pull half is notification.service.ts, and it is still the source of
 * truth. This only says "something arrived, here it is", so a dropped message
 * costs nothing: the client refetches on every (re)connect, and any row missed
 * while the socket was down comes back in that fetch. Treating the socket as
 * authoritative is the one thing that would make this fragile, so nothing here
 * ever removes or reorders anything — it only ever hands over what arrived.
 *
 * ONE socket per tab, not one per component. The bell and the notifications
 * page both want the same events, and a hook that opened its own connection
 * would give a user on /notifications two sockets, two heartbeats and two
 * copies of every push. So this is a module-level singleton with reference
 * counting: the first subscriber opens the connection, the last one to leave
 * closes it.
 *
 * Authentication is the first message rather than a header because the browser
 * WebSocket API cannot set headers, and a token in the query string would be
 * written to the server's access log and the user's history. See the matching
 * note on the backend route.
 */

export type NotificationStreamStatus =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  /** The server rejected our token. Terminal — retrying cannot fix it. */
  | "unauthorized";

export type NotificationStreamEvent =
  | { kind: "notification"; notification: NotificationItem; unreadCount: number }
  | { kind: "unread-count"; unreadCount: number }
  /**
   * The socket just (re)connected. Subscribers must refetch when they see
   * this: it is the only signal that there may be a gap to close, and it
   * fires on the very first connect too, so a listener that always refetches
   * on it is always consistent.
   */
  | { kind: "reconnected" }
  | { kind: "status"; status: NotificationStreamStatus };

type Listener = (event: NotificationStreamEvent) => void;

/** Client heartbeat. Comfortably under the backend's 90s silence timeout, and
 *  short enough to keep proxies from closing an idle connection — nginx's
 *  default proxy_read_timeout is 60s and it counts silence, not idleness. */
const HEARTBEAT_MS = 25_000;

/** Reconnect backoff. Capped so a server restart is picked up within half a
 *  minute rather than the several minutes uncapped doubling would reach. */
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

const listeners = new Set<Listener>();

let socket: WebSocket | null = null;
let status: NotificationStreamStatus = "idle";
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
/** Set while we are deliberately tearing down, so the close handler knows not
 *  to treat its own shutdown as a dropped connection and reconnect. */
let closingDeliberately = false;
let browserListenersAttached = false;

function resolveSocketUrl(): string | null {
  if (typeof window === "undefined") return null;

  // VITE_API_URL already ends in /api/v1; the ws route lives beneath it.
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
  const absolute = /^https?:\/\//i.test(base)
    ? base
    : `${window.location.origin}${base}`;

  try {
    const url = new URL(`${absolute.replace(/\/$/, "")}/ws/notifications`);
    // ws over http, wss over https — never downgrade, or a browser on an
    // https page would block the connection as mixed content anyway.
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString();
  } catch {
    return null;
  }
}

function emit(event: NotificationStreamEvent) {
  // Copied before iterating: a listener may unsubscribe in response to what it
  // receives (the bell does, on unmount), and mutating the set mid-iteration
  // would skip whoever came after it.
  for (const listener of [...listeners]) {
    try {
      listener(event);
    } catch {
      // One broken subscriber must not stop the others from being told.
    }
  }
}

function setStatus(next: NotificationStreamStatus) {
  if (status === next) return;
  status = next;
  emit({ kind: "status", status: next });
}

function stopHeartbeat() {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ping" }));
    }
  }, HEARTBEAT_MS);
}

function clearReconnect() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect() {
  if (listeners.size === 0 || status === "unauthorized") return;
  clearReconnect();

  // Exponential backoff with jitter. The jitter matters more than it looks:
  // when the API restarts, every connected browser is disconnected in the same
  // instant, and without it they would all retry in the same instant too and
  // knock it over again.
  const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempts, RECONNECT_MAX_MS);
  const jittered = delay * (0.5 + Math.random() * 0.5);
  reconnectAttempts += 1;

  setStatus("reconnecting");
  reconnectTimer = setTimeout(connect, jittered);
}

function teardownSocket() {
  stopHeartbeat();
  if (!socket) return;

  closingDeliberately = true;
  // Detach first: a closed socket still fires onclose, and that handler would
  // otherwise queue a reconnect for a stream nobody is listening to any more.
  socket.onopen = null;
  socket.onmessage = null;
  socket.onerror = null;
  socket.onclose = null;
  try {
    socket.close();
  } catch {
    // Already closing or closed — nothing to do.
  }
  socket = null;
  closingDeliberately = false;
}

function handleMessage(raw: string) {
  let message: Record<string, unknown>;
  try {
    message = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return;
  }

  switch (message.type) {
    case "ready": {
      reconnectAttempts = 0;
      setStatus("open");
      if (typeof message.unread_count === "number") {
        emit({ kind: "unread-count", unreadCount: message.unread_count });
      }
      // Always last, and always sent: subscribers use this to close any gap
      // from before the socket existed, not just after a drop.
      emit({ kind: "reconnected" });
      return;
    }

    case "notification": {
      const raw = message.notification as
        | {
            id: number;
            type: string;
            payload: Record<string, unknown>;
            is_read: boolean;
            created_at: string;
            read_at: string | null;
          }
        | undefined;
      if (!raw) return;
      emit({
        kind: "notification",
        notification: {
          id: raw.id,
          type: raw.type as NotificationType,
          payload: raw.payload as NotificationItem["payload"],
          isRead: raw.is_read,
          createdAt: raw.created_at,
          readAt: raw.read_at,
        },
        unreadCount:
          typeof message.unread_count === "number" ? message.unread_count : 0,
      });
      return;
    }

    case "unread_count": {
      if (typeof message.unread_count === "number") {
        emit({ kind: "unread-count", unreadCount: message.unread_count });
      }
      return;
    }

    case "unauthorized": {
      // Terminal on purpose. The token is bad, expired or revoked, and
      // reconnecting with the same one would just be a retry loop against a
      // door that will not open. The next real API call refreshes the token or
      // ends the session, and the auth-change listener below reconnects us.
      setStatus("unauthorized");
      teardownSocket();
      return;
    }

    // "pong" needs no handling — receiving anything at all is the proof of
    // life the heartbeat is asking for.
    default:
      return;
  }
}

function connect() {
  if (typeof window === "undefined") return;
  if (listeners.size === 0) return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const session = loadSession();
  if (!session?.token) {
    // Signed out. Not an error and not worth retrying — logging back in fires
    // the auth-change event, which reconnects.
    setStatus("idle");
    return;
  }

  const url = resolveSocketUrl();
  if (!url) return;

  clearReconnect();
  setStatus(status === "idle" ? "connecting" : status);

  let next: WebSocket;
  try {
    next = new WebSocket(url);
  } catch {
    scheduleReconnect();
    return;
  }
  socket = next;

  next.onopen = () => {
    // Nothing is "connected" until the server accepts the token, so the status
    // stays as-is until "ready" arrives.
    next.send(JSON.stringify({ type: "auth", token: session.token }));
    startHeartbeat();
  };

  next.onmessage = (event) => {
    if (typeof event.data === "string") handleMessage(event.data);
  };

  next.onerror = () => {
    // onclose always follows, and that is where reconnecting is handled.
  };

  next.onclose = () => {
    stopHeartbeat();
    if (socket === next) socket = null;
    if (closingDeliberately || listeners.size === 0) return;
    if (status === "unauthorized") return;
    scheduleReconnect();
  };
}

/** Reconnect immediately when the tab wakes or the network returns, instead of
 *  waiting out a backoff that may have grown to 30s while the laptop was shut. */
function handleWake() {
  if (listeners.size === 0) return;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  if (socket?.readyState === WebSocket.OPEN) return;
  reconnectAttempts = 0;
  clearReconnect();
  connect();
}

/** Logging in or out replaces the token the open socket authenticated with, so
 *  the connection has to be rebuilt around the new one (or dropped entirely). */
function handleAuthChange() {
  teardownSocket();
  reconnectAttempts = 0;
  // A previous rejection must not outlive the session that caused it.
  if (status === "unauthorized") status = "idle";
  clearReconnect();
  if (listeners.size > 0) connect();
}

function attachBrowserListeners() {
  if (browserListenersAttached || typeof window === "undefined") return;
  browserListenersAttached = true;
  window.addEventListener("online", handleWake);
  window.addEventListener("focus", handleWake);
  document.addEventListener("visibilitychange", handleWake);
  window.addEventListener("gwc:auth-state-changed", handleAuthChange);
}

/**
 * Start receiving live notification events. Returns an unsubscribe function;
 * the socket closes once the last subscriber has gone.
 */
export function subscribeToNotificationStream(listener: Listener): () => void {
  if (typeof window === "undefined") return () => {};

  listeners.add(listener);
  attachBrowserListeners();

  if (listeners.size === 1) {
    reconnectAttempts = 0;
    if (status === "unauthorized") status = "idle";
    connect();
  } else if (socket?.readyState === WebSocket.OPEN) {
    // A latecomer joining an already-open stream still needs to be told to
    // fetch, since it has no state of its own yet.
    listener({ kind: "status", status });
    listener({ kind: "reconnected" });
  } else if (socket === null && reconnectTimer === null && status !== "unauthorized") {
    // There are subscribers but nothing connected and nothing scheduled — the
    // first one to arrive tried before the session was readable and gave up,
    // since being signed out is not a retryable condition. Without this, the
    // stream would stay dead until the next login or logout, because only
    // subscriber number one ever calls connect().
    //
    // Guarded on there being no pending reconnect so that mounting components
    // cannot walk over an active backoff and turn it into a tight retry loop.
    connect();
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearReconnect();
      teardownSocket();
      setStatus("idle");
    }
  };
}

/** Current connection state, for a UI that wants to show it. */
export function notificationStreamStatus(): NotificationStreamStatus {
  return status;
}
