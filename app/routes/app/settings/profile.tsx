import { ProfileSettings } from "~/features/settings/profile-settings";

export function meta() {
  return [
    { title: "Profile — GWC Class Scheduling" },
    { name: "description", content: "View your account profile and notification preferences." },
  ];
}

export default function ProfileRoute() {
  return <ProfileSettings />;
}
