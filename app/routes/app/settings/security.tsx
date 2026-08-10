import { SecuritySettings } from "~/features/settings/security-settings";

export function meta() {
  return [
    { title: "Password — GWC Class Scheduling" },
    { name: "description", content: "Change the password you use to sign in." },
  ];
}

export default function SecurityRoute() {
  return <SecuritySettings />;
}
