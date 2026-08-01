import { RoleGuard } from "~/auth/role-guard";
import { StudentBulkImport } from "~/features/students/student-bulk-import";

export function meta() {
  return [
    { title: "Bulk Import Regular Students — GWC Class Scheduling" },
    {
      name: "description",
      content: "Import regular class student records from a CSV file or pasted data.",
    },
  ];
}

export default function StudentsRegularBulkRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <StudentBulkImport enrolledStatus="Regular" />
    </RoleGuard>
  );
}
