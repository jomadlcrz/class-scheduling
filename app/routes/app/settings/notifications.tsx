import { NotificationSettings } from "~/features/settings/notification-settings";

export function meta() {
  return [
    { title: "Notifications — GWC Class Scheduling" },
    { name: "description", content: "Choose which in-app notifications you receive." },
  ];
}

export default function NotificationsRoute() {
  return <NotificationSettings />;
}
