import { StudentsPage } from "~/routes/app/students";
import { RoleGuard } from "~/auth/role-guard";

export function meta() {
  return [
    { title: "Regular Students — GWC Class Scheduling" },
    { name: "description", content: "View regular class students." },
  ];
}

export default function StudentsRegularRoute() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <StudentsPage />
    </RoleGuard>
  );
}
