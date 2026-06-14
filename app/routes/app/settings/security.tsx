import { SecuritySettings } from "../../../features/settings/security-settings";

export function meta() {
  return [
    { title: "Security — GWC Class Scheduling" },
    { name: "description", content: "Manage your account security and change your password." },
  ];
}

export default function SecurityRoute() {
  return <SecuritySettings />;
}
