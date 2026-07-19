import { useState } from "react";
import { Switch } from "~/components/ui/switch";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { Breadcrumb } from "~/layouts/breadcrumb";

type NotificationPrefs = {
  scheduleReminders: boolean;
  conflictAlerts: boolean;
  systemAnnouncements: boolean;
};

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    scheduleReminders: true,
    conflictAlerts: true,
    systemAnnouncements: false,
  });

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Notifications" }]} />
      <SettingsPageHeader title="Notifications" />

      <div className="mt-6 flex flex-col divide-y divide-slate-200 dark:divide-white/10">
        <div className="py-4 first:pt-0 last:pb-0">
          <Switch
            id="notif-schedule"
            label="Schedule reminders"
            description="Get notified when upcoming schedules are published or changed."
            checked={prefs.scheduleReminders}
            onChange={() => toggle("scheduleReminders")}
          />
        </div>
        <div className="py-4 first:pt-0 last:pb-0">
          <Switch
            id="notif-conflicts"
            label="Conflict alerts"
            description="Be alerted when scheduling conflicts are detected."
            checked={prefs.conflictAlerts}
            onChange={() => toggle("conflictAlerts")}
          />
        </div>
        <div className="py-4 first:pt-0 last:pb-0">
          <Switch
            id="notif-system"
            label="System announcements"
            description="Receive general system and maintenance notifications."
            checked={prefs.systemAnnouncements}
            onChange={() => toggle("systemAnnouncements")}
          />
        </div>
      </div>
    </div>
  );
}
