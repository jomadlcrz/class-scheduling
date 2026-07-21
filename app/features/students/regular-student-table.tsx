import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { RegularStudentRow } from "~/types/student";

/** GET /students/regular roster — read-only, mirrors StudentAccountTable's layout. */
export function RegularStudentTable({ students }: { students: RegularStudentRow[] }) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Student ID</TableHeader>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Program</TableHeader>
        <TableHeader className="hidden lg:table-cell">Email</TableHeader>
      </TableHead>
      <TableBody>
        {students.map((student) => {
          const latest = student.academics[student.academics.length - 1];
          return (
            <TableRow key={student.studentProfileId}>
              <TableCell className="text-slate-600 dark:text-slate-300">
                {student.studentId ?? "—"}
              </TableCell>
              <TableCell>
                <span className="font-medium text-navy-700 dark:text-mist-100">
                  {student.lastName}, {student.firstName}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
                {latest?.program ?? "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-slate-500 dark:text-slate-400">
                {student.email ?? "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
