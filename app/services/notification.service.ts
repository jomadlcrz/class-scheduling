import { apiGet, apiPost } from "~/lib/api";
import type { NotificationInbox, NotificationItem, NotificationPayload, NotificationType } from "~/types/notification";

/** Notification inbox — one self-scoped read path for every role's portal. */

type RawNotification = {
  id: number;
  type: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

function mapNotification(raw: RawNotification): NotificationItem {
  return {
    id: raw.id,
    type: raw.type as NotificationType,
    payload: raw.payload as NotificationPayload,
    isRead: raw.is_read,
    createdAt: raw.created_at,
    readAt: raw.read_at,
  };
}

export type ListNotificationsOptions = {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
  types?: string[];
};

type NotificationsApiResponse = {
  unread_count: number;
  total?: number;
  page?: number;
  per_page?: number;
  has_more?: boolean;
  notifications: RawNotification[];
};

/** GET /notifications — the caller's own inbox, newest first. */
async function list(options?: ListNotificationsOptions): Promise<NotificationInbox> {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.per_page) params.set("per_page", String(options.per_page));
  if (options?.unread_only) params.set("unread_only", "true");
  if (options?.types && options.types.length > 0) {
    params.set("types", options.types.join(","));
  }

  const query = params.toString();
  const endpoint = query ? `/notifications?${query}` : "/notifications";
  const data = await apiGet<NotificationsApiResponse>(endpoint);

  return {
    unreadCount: data.unread_count,
    total: data.total,
    page: data.page,
    perPage: data.per_page,
    hasMore: data.has_more,
    notifications: (data.notifications || []).map(mapNotification),
  };
}

/** POST /notifications/:id/read — scoped to the caller. */
async function markRead(id: number): Promise<void> {
  await apiPost<{ message?: string }>(`/notifications/${id}/read`);
}

/** POST /notifications/read-all — marks the caller's whole inbox read. */
async function markAllRead(): Promise<void> {
  await apiPost<{ message?: string }>("/notifications/read-all");
}

export const notificationService = { list, markRead, markAllRead };
