import { AppearanceSettings } from "../../../features/settings/appearance-settings";

export function meta() {
  return [
    { title: "Appearance — GWC Class Scheduling" },
    { name: "description", content: "Customize the look and feel of the application." },
  ];
}

export default function AppearanceRoute() {
  return <AppearanceSettings />;
}
