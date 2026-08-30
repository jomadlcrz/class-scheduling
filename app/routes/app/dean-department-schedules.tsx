import { RoleGuard } from "~/auth/role-guard";
import { DeanDepartmentSchedulesPage } from "~/features/dean-approvals/dean-department-schedules-page";

export function meta() {
  return [
    { title: "Department Schedules — GWC Class Scheduling" },
    { name: "description", content: "Review and approve schedules submitted by the registrar for your department." },
  ];
}

export default function DeanDepartmentSchedulesRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <DeanDepartmentSchedulesPage />
    </RoleGuard>
  );
}
