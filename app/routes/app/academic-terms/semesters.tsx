import { RoleGuard } from "~/auth/role-guard";
import { SemestersPage } from "~/features/academic-terms/semesters-page";

export function meta() {
  return [
    { title: "Semesters — GWC Class Scheduling" },
    { name: "description", content: "Reference list of semesters used across all school years." },
  ];
}

export default function SemestersRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <SemestersPage />
    </RoleGuard>
  );
}
