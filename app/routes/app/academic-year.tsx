import { RoleGuard } from "~/auth/role-guard";
import { AcademicYearPage } from "~/features/academic-year/academic-year-page";

export function meta() {
  return [
    { title: "Academic Years — GWC Class Scheduling" },
    { name: "description", content: "Manage school years and their semesters." },
  ];
}

export default function AcademicYear() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <AcademicYearPage />
    </RoleGuard>
  );
}
