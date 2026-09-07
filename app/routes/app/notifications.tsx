import { useState } from "react";
import { useNavigate } from "react-router";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
import { EmptyState } from "~/components/feedback/empty-state";
import { Button } from "~/components/ui/button";
import { BellIcon, CheckIcon } from "~/components/ui/icons";
import { Skeleton } from "~/components/ui/skeleton";
import { TabList } from "~/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { resolveNotificationTarget } from "~/features/notifications/notification-navigation";
import { notificationText } from "~/features/notifications/notification-bell";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { ScreenHeader } from "~/components/ui/screen-header";
import { notificationService } from "~/services/notification.service";
import type { NotificationItem } from "~/types/notification";

export function meta() {
  return [{ title: "Notifications — GWC Class Scheduling" }];
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

type Filter = "all" | "unread";

const FILTER_TABS = [
  { value: "all" as const, label: "All" },
  { value: "unread" as const, label: "Unread" },
];

function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const {
    data: inbox,
    error,
    reload,
  } = useCachedData(
    `notifications:${filter}:${page}`,
    () => notificationService.list({ page, per_page: 20, unread_only: filter === "unread" }),
    { cache: false },
  );

  const notifications = inbox?.notifications ?? [];
  const unreadCount = inbox?.unreadCount ?? 0;
  const hasMore = inbox?.hasMore ?? false;

  async function handleOpen(notification: NotificationItem) {
    if (!notification.isRead) {
      try {
        await notificationService.markRead(notification.id);
      } catch {
        // silently fail
      }
    }

    const target = resolveNotificationTarget(notification, user?.role);
    if (target) {
      navigate(target);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    try {
      await notificationService.markAllRead();
      reload();
    } catch {
      // silently fail
    }
  }

  function handleFilterChange(newFilter: Filter) {
    setFilter(newFilter);
    setPage(1);
  }

  const isStudent = user?.role === "student";

  return (
    <div className="flex w-full flex-col">
      {isStudent && (
        <ScreenHeader
          title="Notifications"
          className="lg:hidden"
          rightAction={
            unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="cursor-pointer text-xs font-bold text-gwc-blue hover:underline dark:text-gwc-blue-bright"
              >
                Mark all read
              </button>
            ) : null
          }
        />
      )}

      <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:py-6 lg:py-8">
        <div className={isStudent ? "hidden lg:block" : ""}>
          <PageHeader
          title="Notifications"
          actions={
            unreadCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                block={false}
                onClick={handleMarkAllRead}
              >
                <CheckIcon size={14} />
                Mark all read
              </Button>
            ) : undefined
          }
        />
      </div>

      <div className="mt-6">
        <TabList
          ariaLabel="Notification filter"
          tabs={FILTER_TABS}
          value={filter}
          onChange={handleFilterChange}
        />
      </div>

      {/* Content */}
      <div className="mt-6">
        {error ? (
          <DataLoadAlert
            title="Could not load notifications"
            message={error}
            onRetry={reload}
          />
        ) : inbox === null ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : notifications.length === 0 ? (
          <EmptyState
            title={filter === "unread" ? "No unread notifications" : "No notifications"}
          >
            {filter === "unread" ? "You're all caught up!" : "You don't have any notifications yet."}
          </EmptyState>
        ) : (
          <>
            {/* Mobile Card List View (< sm screens) */}
            <div className="flex flex-col gap-2.5 sm:hidden">
              {notifications.map((notification) => {
                const text = notificationText(notification);
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleOpen(notification)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                      notification.isRead
                        ? "border-slate-200/80 bg-white dark:border-white/10 dark:bg-surface"
                        : "border-blue-200/90 bg-blue-50/50 dark:border-gwc-blue-deep/70 dark:bg-surface-raised"
                    }`}
                  >
                    <div className="relative mt-0.5 shrink-0">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full ${
                          notification.isRead
                            ? "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                            : "bg-blue-100 text-gwc-blue dark:bg-gwc-blue-deep dark:text-gwc-blue-soft"
                        }`}
                      >
                        <BellIcon />
                      </div>
                      {!notification.isRead && (
                        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-gwc-blue dark:bg-gwc-blue-bright" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={`text-sm ${
                            notification.isRead
                              ? "font-medium text-slate-700 dark:text-slate-300"
                              : "font-bold text-navy-700 dark:text-mist-100"
                          }`}
                        >
                          {text.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                          {relativeTime(notification.createdAt)}
                        </span>
                      </div>
                      {text.detail && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {text.detail}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop Table View (>= sm screens) */}
            <div className="hidden sm:block">
              <Table>
                <TableHead>
                  <TableHeader className="w-4">
                    <span className="sr-only">Status</span>
                  </TableHeader>
                  <TableHeader>Notification</TableHeader>
                  <TableHeader className="hidden md:table-cell">Details</TableHeader>
                  <TableHeader className="text-right">Time</TableHeader>
                </TableHead>
                <TableBody>
                  {notifications.map((notification) => {
                    const text = notificationText(notification);
                    return (
                      <TableRow
                        key={notification.id}
                        className="cursor-pointer"
                        onClick={() => handleOpen(notification)}
                      >
                        <TableCell className="w-4">
                          {!notification.isRead && (
                            <span className="block size-2 rounded-full bg-gwc-blue dark:bg-gwc-blue-bright" />
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${
                              notification.isRead
                                ? "text-slate-500 dark:text-slate-400"
                                : "text-slate-800 dark:text-slate-100"
                            }`}
                          >
                            {text.title}
                          </span>
                        </TableCell>
                        <TableCell className="hidden max-w-xs truncate md:table-cell text-xs text-slate-500 dark:text-slate-400">
                          {text.detail || "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-400 dark:text-slate-500">
                          {relativeTime(notification.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!error && inbox !== null && (
        <div className="mt-4 flex justify-center gap-2">
          {page > 1 && (
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
          )}
          {hasMore && (
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export default function NotificationsRoute() {
  return <NotificationsPage />;
}
