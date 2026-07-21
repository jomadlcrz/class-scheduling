import { RoleGuard } from "~/auth/role-guard";
import { AcademicYearPage } from "~/features/academic-year/academic-year-page";

export function meta() {
  return [
    { title: "Academic Year — GWC Class Scheduling" },
    { name: "description", content: "Manage school years and semesters." },
  ];
}

export default function AcademicYear() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <AcademicYearPage />
    </RoleGuard>
  );
}
