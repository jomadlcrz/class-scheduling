import { RoleGuard } from "~/auth/role-guard";
import { AdminAuditLogPage } from "~/features/admin/admin-audit-log-page";

export function meta() {
  return [
    { title: "Audit Log — GWC Class Scheduling" },
  ];
}

export default function AuditLog() {
  return (
    <RoleGuard allow={["admin"]}>
      <AdminAuditLogPage />
    </RoleGuard>
  );
}
