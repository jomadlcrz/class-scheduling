import { RoleGuard } from "~/auth/role-guard";
import { BulkSubjectAssignment } from "~/features/dean-assignments/bulk-subject-assignment";

export function meta() {
  return [{ title: "Assign Subjects — GWC Class Scheduling" }];
}

export default function DeanBulkSubjectAssignmentsRoute() {
  return <RoleGuard allow={["dean"]}><BulkSubjectAssignment /></RoleGuard>;
}
