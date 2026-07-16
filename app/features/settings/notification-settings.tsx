import { useState } from "react";
import { SettingsCard } from "~/components/ui/settings-card";
import { Switch } from "~/components/ui/switch";
import { Breadcrumb } from "~/layouts/breadcrumb";
import { PageHeader } from "~/layouts/page-header";

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
      <PageHeader title="Notifications" description="Choose which in-app notifications you receive." />

      <div className="mt-6">
        <SettingsCard title="In-App Notifications">
          <div className="flex flex-col gap-3">
            <Switch
              id="notif-schedule"
              label="Schedule reminders"
              description="Get notified when upcoming schedules are published or changed."
              checked={prefs.scheduleReminders}
              onChange={() => toggle("scheduleReminders")}
            />
            <div className="border-t border-slate-100 dark:border-white/8" />
            <Switch
              id="notif-conflicts"
              label="Conflict alerts"
              description="Be alerted when scheduling conflicts are detected."
              checked={prefs.conflictAlerts}
              onChange={() => toggle("conflictAlerts")}
            />
            <div className="border-t border-slate-100 dark:border-white/8" />
            <Switch
              id="notif-system"
              label="System announcements"
              description="Receive general system and maintenance notifications."
              checked={prefs.systemAnnouncements}
              onChange={() => toggle("systemAnnouncements")}
            />
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
