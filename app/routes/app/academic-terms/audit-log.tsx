import { RoleGuard } from "~/auth/role-guard";
import { AcademicTermsAuditLogPage } from "~/features/academic-terms/academic-terms-audit-log-page";

export function meta() {
  return [
    { title: "Academic Terms Audit Log — GWC Class Scheduling" },
    {
      name: "description",
      content: "Review the history of actions performed on academic terms.",
    },
  ];
}

export default function AcademicTermsAuditLogRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <AcademicTermsAuditLogPage />
    </RoleGuard>
  );
}
