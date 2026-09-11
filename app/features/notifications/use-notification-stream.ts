import { useEffect, useRef, useState } from "react";
import {
  subscribeToNotificationStream,
  type NotificationStreamStatus,
} from "~/services/notification-socket";
import type { NotificationItem } from "~/types/notification";

type StreamHandlers = {
  /** A notification just arrived, with the recipient's new unread total. */
  onNotification?: (notification: NotificationItem, unreadCount: number) => void;
  /** The badge moved without a new row — usually this user reading one elsewhere. */
  onUnreadCount?: (unreadCount: number) => void;
  /**
   * The socket (re)connected. Refetch here: this fires on the first connect
   * and after every drop, and it is the only chance to pick up anything that
   * happened while the connection was down.
   */
  onReconnected?: () => void;
};

/**
 * Subscribe a component to the live notification stream.
 *
 * Handlers are kept in a ref rather than being listed as effect dependencies
 * so that passing inline closures — which every caller does — does not tear the
 * subscription down and rebuild it on every render. The effect runs once; the
 * ref keeps it calling the latest closures.
 */
export function useNotificationStream(handlers: StreamHandlers): NotificationStreamStatus {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [status, setStatus] = useState<NotificationStreamStatus>("idle");

  useEffect(() => {
    return subscribeToNotificationStream((event) => {
      switch (event.kind) {
        case "notification":
          handlersRef.current.onNotification?.(event.notification, event.unreadCount);
          break;
        case "unread-count":
          handlersRef.current.onUnreadCount?.(event.unreadCount);
          break;
        case "reconnected":
          handlersRef.current.onReconnected?.();
          break;
        case "status":
          setStatus(event.status);
          break;
      }
    });
  }, []);

  return status;
}
