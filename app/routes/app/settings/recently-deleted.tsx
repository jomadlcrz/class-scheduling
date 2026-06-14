import { RoleGuard } from "../../../auth/role-guard";
import { RecentlyDeleted } from "../../../features/settings/recently-deleted";

export function meta() {
  return [
    { title: "Recently Deleted — GWC Class Scheduling" },
    { name: "description", content: "Restore recently deleted items before they are permanently removed." },
  ];
}

export default function RecentlyDeletedRoute() {
  return (
    <RoleGuard allow={["admin"]}>
      <RecentlyDeleted />
    </RoleGuard>
  );
}
