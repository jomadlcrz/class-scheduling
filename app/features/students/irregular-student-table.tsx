import { Button } from "~/components/ui/button";
import { EyeIcon, GraduationCapIcon, UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { IrregularStudent } from "~/services/irregular-class.service";
import type { StudentAccountRow } from "~/types/student";

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

type IrregularStudentTableProps = {
  students: IrregularStudent[];
  onView?: (student: IrregularStudent) => void;
  onEnroll?: (student: IrregularStudent) => void;
  /** Admin-only: maps studentProfileId → hasAccount */
  accountLookup?: Record<number, boolean>;
  accountActiveById?: Record<number, boolean | undefined>;
  onCreateAccount?: ((student: StudentAccountRow) => void) | null;
  onDeactivateAccount?: ((student: StudentAccountRow) => void) | null;
  onReactivateAccount?: ((student: StudentAccountRow) => void) | null;
};

function toAccountRow(s: IrregularStudent): StudentAccountRow {
  return {
    studentProfileId: s.studentProfileId,
    studentId: s.studentId,
    firstName: s.firstName,
    midName: s.midName,
    lastName: s.lastName,
    mobile: s.mobile,
    email: s.email,
    hasAccount: false,
    academics: [],
  };
}

export function IrregularStudentTable({
  students,
  onView,
  onEnroll,
  accountLookup,
  accountActiveById,
  onCreateAccount,
  onDeactivateAccount,
  onReactivateAccount,
}: IrregularStudentTableProps) {
  const hasActions = onView || onEnroll || onCreateAccount || onDeactivateAccount || onReactivateAccount;
  return (
    <Table>
      <TableHead>
        <TableHeader>Student ID</TableHeader>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Program</TableHeader>
        <TableHeader className="hidden lg:table-cell">Email</TableHeader>
        {hasActions && (
          <TableHeader>
            <span className="sr-only">Actions</span>
          </TableHeader>
        )}
      </TableHead>
      <TableBody>
        {students.map((student) => {
          const hasAccount = accountLookup?.[student.studentProfileId];
          const isActive = accountActiveById?.[student.studentProfileId];
          return (
          <TableRow key={student.studentProfileId}>
            <TableCell className="text-slate-600 dark:text-slate-300">
              {student.studentId ?? "—"}
            </TableCell>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">
                {student.studentName}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
              {student.programTaken || "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-slate-500 dark:text-slate-400">
              {student.email ?? "—"}
            </TableCell>
            {hasActions && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  {onView && (
                    <button
                      type="button"
                      onClick={() => onView(student)}
                      aria-label={`View ${student.studentName}`}
                      title="View details"
                      className={actionButtonClassName}
                    >
                      <EyeIcon />
                    </button>
                  )}
                  {onEnroll && (
                    <button
                      type="button"
                      onClick={() => onEnroll(student)}
                      aria-label={`Enroll ${student.studentName} for a new term`}
                      title="Enroll for a new term"
                      className={actionButtonClassName}
                    >
                      <GraduationCapIcon />
                    </button>
                  )}
                  {onDeactivateAccount && onReactivateAccount && accountLookup && (
                    hasAccount ? (
                      isActive === undefined ? (
                        <span className="grid size-8 place-items-center text-slate-300 dark:text-slate-600">…</span>
                      ) : isActive ? (
                        <button
                          type="button"
                          onClick={() => onDeactivateAccount(toAccountRow(student))}
                          aria-label={`Deactivate account for ${student.studentName}`}
                          title="Deactivate account"
                          className={actionButtonClassName}
                        >
                          <UserOffIcon />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onReactivateAccount(toAccountRow(student))}
                          aria-label={`Reactivate account for ${student.studentName}`}
                          title="Reactivate account"
                          className={actionButtonClassName}
                        >
                          <UserCheckIcon />
                        </button>
                      )
                    ) : (
                      onCreateAccount && (
                        <Button
                          type="button"
                          variant="outline"
                          block={false}
                          onClick={() => onCreateAccount(toAccountRow(student))}
                        >
                          Create Account
                        </Button>
                      )
                    )
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
