import { RoleGuard } from "~/auth/role-guard";
import { DeanScheduleApprovalDetailPage } from "~/features/dean-approvals/dean-schedule-approval-detail-page";

export function meta() {
  return [{ title: "Schedule Approval Detail — GWC Class Scheduling" }];
}

export default function DeanScheduleApprovalDetailRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <DeanScheduleApprovalDetailPage />
    </RoleGuard>
  );
}
