import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge } from "~/components/ui/badge";
import { Spinner } from "~/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { PageHeader } from "~/layouts/page-header";
import { irregularClassService, type IrregularStudent } from "~/services/irregular-class.service";

export function meta() {
  return [
    { title: "Irregular Class — GWC Class Scheduling" },
    { name: "description", content: "Manage irregular class schedules for the current academic term." },
  ];
}

export default function IrregularClassRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <IrregularClassPage />
    </RoleGuard>
  );
}

function IrregularClassPage() {
  const [students, setStudents] = useState<IrregularStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    irregularClassService
      .listStudents()
      .then(setStudents)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again."),
      );
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Irregular Class"
        description="Irregular class schedules for the current academic term."
      />
      <div className="mt-6">
        {error ? (
          <EmptyState title="Couldn't load irregular students">{error}</EmptyState>
        ) : students === null ? (
          <div
            role="status"
            aria-label="Loading irregular students"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : students.length === 0 ? (
          <EmptyState title="No irregular students">
            No students are currently flagged as irregular.
          </EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableHeader>Student ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader className="hidden sm:table-cell">Program</TableHeader>
              <TableHeader>Enrolled Subjects</TableHeader>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell className="font-medium text-navy-700 dark:text-white">
                    {student.studentId}
                  </TableCell>
                  <TableCell>{student.studentName}</TableCell>
                  <TableCell className="hidden sm:table-cell">{student.programTaken}</TableCell>
                  <TableCell>
                    {student.subjectsEnrolled.length === 0 ? (
                      "—"
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {student.subjectsEnrolled.map((subject) => (
                          <Badge key={subject.subjectId} tone="slate">
                            {subject.subjectCode}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
