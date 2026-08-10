import { AccountDetails } from "~/features/settings/account-details";

export function meta() {
  return [
    { title: "Account Details — GWC Class Scheduling" },
    { name: "description", content: "View your account details and profile picture." },
  ];
}

export default function AccountDetailsRoute() {
  return <AccountDetails />;
}
