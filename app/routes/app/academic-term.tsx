import { RoleGuard } from "~/auth/role-guard";
import { AcademicTermPage } from "~/features/academic-term/academic-term-page";

export function meta() {
  return [
    { title: "Academic Terms — GWC Class Scheduling" },
    { name: "description", content: "Manage school years and their semesters." },
  ];
}

export default function AcademicTerm() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <AcademicTermPage />
    </RoleGuard>
  );
}
