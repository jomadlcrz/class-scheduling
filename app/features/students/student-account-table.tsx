import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { StudentAccountRow } from "~/types/student";

type StudentAccountTableProps = {
  students: StudentAccountRow[];
  onCreateAccount: (student: StudentAccountRow) => void;
};

export function StudentAccountTable({ students, onCreateAccount }: StudentAccountTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Student ID</TableHeader>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Email</TableHeader>
        <TableHeader className="hidden lg:table-cell">Mobile</TableHeader>
        <TableHeader>Account</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.studentProfileId}>
            <TableCell className="text-slate-600 dark:text-slate-300">
              {student.studentId}
            </TableCell>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">
                {student.lastName}, {student.firstName}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
              {student.email ?? "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-slate-500 dark:text-slate-400">
              {student.mobile ?? "—"}
            </TableCell>
            <TableCell>
              <Badge tone={student.hasAccount ? "emerald" : "slate"}>
                {student.hasAccount ? "Active" : "No account"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                {!student.hasAccount && (
                  <Button
                    type="button"
                    variant="outline"
                    block={false}
                    onClick={() => onCreateAccount(student)}
                  >
                    Create Account
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
