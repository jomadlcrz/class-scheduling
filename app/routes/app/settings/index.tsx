import { SettingsHome } from "~/features/settings/settings-home";

export function meta() {
  return [
    { title: "Settings — GWC Class Scheduling" },
    { name: "description", content: "Manage your account, preferences, and system options." },
  ];
}

export default function SettingsIndexRoute() {
  return <SettingsHome />;
}
