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

/** GET /notifications — the caller's own inbox, newest first. */
async function list(): Promise<NotificationInbox> {
  const data = await apiGet<{ unread_count: number; notifications: RawNotification[] }>("/notifications");
  return {
    unreadCount: data.unread_count,
    notifications: data.notifications.map(mapNotification),
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
