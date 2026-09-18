import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BellIcon, CheckIcon } from "~/components/ui/icons";
import { Popover } from "~/components/ui/popover";
import { Spinner } from "~/components/ui/spinner";
import { resolveNotificationTarget } from "~/features/notifications/notification-navigation";
import { presentNotification } from "~/features/notifications/notification-presentation";
import { useAuth } from "~/hooks/use-auth";
import { notificationService } from "~/services/notification.service";
import type { NotificationItem } from "~/types/notification";

const iconButtonClassName =
  "flex cursor-pointer items-center rounded-lg px-1 py-1 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:bg-white/8";

const itemClassName =
  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md p-2.5 text-left font-body text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-mist-100";

/**
 * Renders one notification's title/detail from its type + payload.
 * Delegates to `presentNotification` (the single source of truth for every
 * NotificationType) instead of keeping a second switch — a second switch is
 * exactly how types like `instructor_availability_declared` previously fell
 * through to the generic "Notification" fallback here despite being fully
 * handled there.
 */
export function notificationText(notification: NotificationItem): { title: string; detail: string } {
  const { title, meta, body } = presentNotification(notification);
  return { title, detail: [meta, body].filter(Boolean).join(" · ") };
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Topbar bell — real inbox from GET /notifications, self-scoped per user. */
export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const inbox = await notificationService.list({ per_page: 5 });
      setNotifications(inbox.notifications);
      setUnreadCount(inbox.unreadCount);
    } catch {
      // Bell stays quiet on failure; the inbox just shows nothing new.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleOpen(notification: NotificationItem, close: () => void) {
    if (!notification.isRead) {
      setNotifications((items) => items.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        await notificationService.markRead(notification.id);
      } catch {
        refresh();
      }
    }

    const target = resolveNotificationTarget(notification, user?.role);
    if (target) {
      close();
      navigate(target);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    try {
      await notificationService.markAllRead();
      setNotifications((items) => items.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      refresh();
    }
  }

  return (
    <Popover
      label="Open notifications"
      onOpenChange={(open) => {
        if (open) refresh();
      }}
      scrollable={false}
      trigger={
        <span className="relative flex size-7 items-center justify-center">
          <BellIcon />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-red-600 font-body text-[0.6rem] font-bold text-mist-100"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
      }
      triggerClassName={iconButtonClassName}
      className="w-80 px-1.5"
    >
      {(close) => (
        <>
          <div className="mb-1 flex items-center justify-between border-b border-slate-100 px-2.5 py-2.5 dark:border-white/10">
            <span className="font-body text-sm font-semibold text-slate-800 dark:text-mist-100">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 font-body text-xs font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-mist-100"
              >
                <CheckIcon size={12} /> Mark all read
              </button>
            )}
          </div>
          {loading ? (
            <div className="grid place-items-center py-10 text-slate-400">
              <Spinner />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-2.5 py-8 text-center">
              <p className="font-body text-sm text-slate-600 dark:text-slate-300">You're all caught up</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const text = notificationText(notification);
              return (
                <button
                  key={notification.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleOpen(notification, close)}
                  className={`${itemClassName} ${notification.isRead ? "opacity-60" : ""}`}
                >
                  <span className="min-w-0">
                    <span
                      className={`block truncate font-medium ${
                        notification.isRead
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {text.title}
                    </span>
                    {text.detail && (
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {text.detail}
                      </span>
                    )}
                    <span className="block text-xs text-slate-400 dark:text-slate-500">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </span>
                  {!notification.isRead && (
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-red-600" />
                  )}
                </button>
              );
            })
          )}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-2.5 py-2 dark:border-white/10">
              <button
                type="button"
                onClick={() => { close(); navigate("/notifications"); }}
                className="w-full cursor-pointer rounded-md px-2.5 py-1.5 text-center font-body text-xs font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-mist-100"
              >
                View all notifications
              </button>
            </div>
          )}
        </>
      )}
    </Popover>
  );
}
