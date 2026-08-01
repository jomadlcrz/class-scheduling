import { RoleGuard } from "~/auth/role-guard";
import { StudentBulkImport } from "~/features/students/student-bulk-import";

export function meta() {
  return [
    { title: "Bulk Import Irregular Students — GWC Class Scheduling" },
    {
      name: "description",
      content: "Import irregular class student records from a CSV file or pasted data.",
    },
  ];
}

export default function StudentsIrregularBulkRoute() {
  return (
    <RoleGuard allow={["registrar"]}>
      <StudentBulkImport enrolledStatus="Irregular" />
    </RoleGuard>
  );
}
