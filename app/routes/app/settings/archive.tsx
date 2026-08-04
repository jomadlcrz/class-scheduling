import { RoleGuard } from "~/auth/role-guard";
import { ArchivePage } from "~/features/settings/archive/archive-page";

export function meta() {
  return [
    { title: "Archive — GWC Class Scheduling" },
    { name: "description", content: "Browse and restore archived records. Data is preserved until you restore it." },
  ];
}

export default function ArchiveRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <ArchivePage />
    </RoleGuard>
  );
}
