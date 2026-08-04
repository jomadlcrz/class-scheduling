import { RoleGuard } from "~/auth/role-guard";
import { SchoolYearsPage } from "~/features/academic-terms/school-years-page";

export function meta() {
  return [
    { title: "School Years — GWC Class Scheduling" },
    { name: "description", content: "Create and manage school years for the academic calendar." },
  ];
}

export default function SchoolYearsRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <SchoolYearsPage />
    </RoleGuard>
  );
}
