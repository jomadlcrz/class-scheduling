import { RoleGuard } from "~/auth/role-guard";
import { SubjectAssignmentView } from "~/features/dean-assignments/subject-assignment-view";

export function meta() {
  return [{ title: "Subject Assignments — GWC Class Scheduling" }, { name: "description", content: "View instructor subject assignments for an academic term." }];
}

export default function DeanSubjectAssignmentsRoute() {
  return <RoleGuard allow={["dean"]}><SubjectAssignmentView /></RoleGuard>;
}
