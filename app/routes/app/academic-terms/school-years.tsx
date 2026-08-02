import { RoleGuard } from "~/auth/role-guard";
import { SchoolYearsPage } from "~/features/academic-terms/school-years-page";

export function meta() {
  return [
    { title: "School Years — GWC Class Scheduling" },
    { name: "description", content: "Create, manage, and archive school years." },
  ];
}

export default function SchoolYearsRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <SchoolYearsPage />
    </RoleGuard>
  );
}
