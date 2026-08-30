import { RoleGuard } from "~/auth/role-guard";
import { DeanDepartmentScheduleDetailPage } from "~/features/dean-approvals/dean-department-schedule-detail-page";

export function meta() {
  return [{ title: "Department Schedule Detail — GWC Class Scheduling" }];
}

export default function DeanDepartmentScheduleDetailRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <DeanDepartmentScheduleDetailPage />
    </RoleGuard>
  );
}
