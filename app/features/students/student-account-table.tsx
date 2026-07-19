import { Button } from "~/components/ui/button";
import { EyeIcon } from "~/components/ui/icons";
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
  onView: (student: StudentAccountRow) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function StudentAccountTable({ students, onCreateAccount, onView }: StudentAccountTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Student ID</TableHeader>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Email</TableHeader>
        <TableHeader className="hidden lg:table-cell">Mobile</TableHeader>
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
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onView(student)}
                  aria-label={`View ${student.firstName} ${student.lastName}`}
                  title="View details"
                  className={actionButtonClassName}
                >
                  <EyeIcon />
                </button>
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
