import { RoleGuard } from "~/auth/role-guard";
import { MySubjectsPage } from "~/features/faculty/my-subjects-page";

export function meta() {
  return [
    { title: "My Subjects — GWC Class Scheduling" },
    {
      name: "description",
      content: "View assigned teaching load subjects and scheduled class meetings.",
    },
  ];
}

export default function FacultyMySubjectsRoute() {
  return (
    <RoleGuard allow={["faculty"]}>
      <MySubjectsPage />
    </RoleGuard>
  );
}
