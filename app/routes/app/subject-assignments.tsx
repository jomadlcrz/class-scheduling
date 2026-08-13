import { RoleGuard } from "~/auth/role-guard";
import { SubjectAssignmentView } from "~/features/subject-assignments/subject-assignment-view";

export function meta() {
  return [{ title: "Subject Assignments — GWC Class Scheduling" }, { name: "description", content: "View instructor subject assignments for an academic term." }];
}

export default function SubjectAssignmentsRoute() {
  return <RoleGuard allow={["dean", "registrar"]}><SubjectAssignmentView /></RoleGuard>;
}
