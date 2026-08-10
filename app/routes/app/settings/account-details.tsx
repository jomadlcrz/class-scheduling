import { ProfileSettings } from "~/features/settings/profile-settings";

export function meta() {
  return [
    { title: "Account Details — GWC Class Scheduling" },
    { name: "description", content: "View your account details and profile picture." },
  ];
}

export default function AccountDetailsRoute() {
  return <ProfileSettings />;
}
