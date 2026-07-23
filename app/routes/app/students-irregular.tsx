import { StudentsPage } from "~/routes/app/students";
import { RoleGuard } from "~/auth/role-guard";

export function meta() {
  return [
    { title: "Irregular Students — GWC Class Scheduling" },
    { name: "description", content: "View irregular class students." },
  ];
}

export default function StudentsIrregularRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <StudentsPage />
    </RoleGuard>
  );
}
