import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { BellIcon } from "~/components/ui/icons";
import { resolveNotificationTarget } from "~/features/notifications/notification-navigation";
import {
  NOTIFICATION_TONE_STYLES,
  presentNotification,
} from "~/features/notifications/notification-presentation";
import { useNotificationStream } from "~/features/notifications/use-notification-stream";
import { useAuth } from "~/hooks/use-auth";
import { notificationService } from "~/services/notification.service";
import { NOTIFICATION_RECIPIENT_ROLES } from "~/types/notification";

/**
 * Raises a toast as each notification arrives.
 *
 * Renders nothing. Mounted EXACTLY ONCE, in the app shell — the stream is a
 * broadcast, so a component that toasted from wherever it happened to be used
 * would fire once per mounted copy. Putting it in the shell also means the
 * toast follows the user across every page rather than only the ones that
 * happen to render a bell.
 *
 * Only the push path reaches here. The refetch that follows a (re)connect goes
 * through the bell and the inbox, not this, so reconnecting after an hour
 * asleep does not dump an hour of backlog on screen as toasts.
 */

const ACTION_TOAST_MS = 10_000;
const BURST_WINDOW_MS = 1_200;

type Burst = {
  id: string | number;
  count: number;
  titles: string[];
  hasAction: boolean;
  timer: ReturnType<typeof setTimeout>;
};

export function NotificationToaster() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const burstRef = useRef<Burst | null>(null);

  useEffect(() => {
    return () => {
      if (burstRef.current) clearTimeout(burstRef.current.timer);
      burstRef.current = null;
    };
  }, []);

  useNotificationStream({
    onNotification: (notification) => {
      if (!user || !NOTIFICATION_RECIPIENT_ROLES.includes(user.role)) return;

      if (location.pathname.startsWith("/notifications")) return;

      const view = presentNotification(notification);
      const target = resolveNotificationTarget(notification, user.role);
      const tone = NOTIFICATION_TONE_STYLES[view.tone];

      const burst = burstRef.current;

      if (burst) {
        clearTimeout(burst.timer);
        burst.count += 1;
        if (!burst.titles.includes(view.title)) burst.titles.push(view.title);
        burst.hasAction = burst.hasAction || view.intent === "action";

        toast(`${burst.count} new notifications`, {
          id: burst.id,
          description: describeBurst(burst.titles),
          icon: (
            <span className={burst.hasAction ? NOTIFICATION_TONE_STYLES.sky.icon : "text-slate-400"}>
              <BellIcon />
            </span>
          ),
          duration: burst.hasAction ? ACTION_TOAST_MS : undefined,
          action: { label: "View all", onClick: () => navigate("/notifications") },
        });

        burst.timer = setTimeout(endBurst, BURST_WINDOW_MS);
        return;
      }

      const open = () => {
        void notificationService.markRead(notification.id).catch(() => {});
        if (target) navigate(target);
      };

      const id = toast(view.title, {
        description: describeOne(view.meta, view.body),
        icon: <span className={tone.icon}>{view.icon}</span>,
        duration: view.intent === "action" ? ACTION_TOAST_MS : undefined,
        action: target ? { label: view.cta ?? "View", onClick: open } : undefined,
      });

      burstRef.current = {
        id,
        count: 1,
        titles: [view.title],
        hasAction: view.intent === "action",
        timer: setTimeout(endBurst, BURST_WINDOW_MS),
      };
    },
  });

  function endBurst() {
    burstRef.current = null;
  }

  return null;
}

function describeOne(meta: string, body?: string | null): string | undefined {
  const detail = body?.trim() || meta?.trim();
  return detail || undefined;
}

function describeBurst(titles: string[]): string {
  const shown = titles.slice(0, 2);
  const remaining = titles.length - shown.length;
  return remaining > 0 ? `${shown.join(" · ")} · +${remaining} more` : shown.join(" · ");
}
