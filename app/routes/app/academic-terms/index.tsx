import { RoleGuard } from "~/auth/role-guard";
import { SchoolYearsPage } from "~/features/academic-terms/school-years-page";

export function meta() {
  return [
    { title: "Academic Terms — GWC Class Scheduling" },
    { name: "description", content: "Create and manage school years for the academic calendar." },
  ];
}

export default function AcademicTermsRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <SchoolYearsPage />
    </RoleGuard>
  );
}
