import { RoleGuard } from "~/auth/role-guard";
import { DeanScheduleApprovalsPage } from "~/features/dean-approvals/dean-schedule-approvals-page";

export function meta() {
  return [
    { title: "Schedule Approvals — GWC Class Scheduling" },
    { name: "description", content: "Review and approve schedules submitted by the registrar for your department." },
  ];
}

export default function DeanScheduleApprovalsRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <DeanScheduleApprovalsPage />
    </RoleGuard>
  );
}
