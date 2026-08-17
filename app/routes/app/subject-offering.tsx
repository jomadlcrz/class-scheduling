import { RoleGuard } from "~/auth/role-guard";
import { SubjectAssignmentView } from "~/features/subject-assignments/subject-assignment-view";

export function meta() {
  return [
    { title: "Subject Offering — GWC Class Scheduling" },
    {
      name: "description",
      content: "Review subject offerings and manage instructor assignments for an academic term.",
    },
  ];
}

export default function SubjectOfferingRoute() {
  return (
    <RoleGuard allow={["dean", "registrar"]}>
      <SubjectAssignmentView />
    </RoleGuard>
  );
}
