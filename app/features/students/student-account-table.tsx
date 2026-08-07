import { Checkbox } from "~/components/ui/checkbox";
import { IconButton } from "~/components/ui/icon-button";
import { ArchiveIcon, EyeIcon, GraduationCapIcon, UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import { archiveActionButtonClassName } from "~/features/archive/archive-icon-styles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { StudentAccountRow } from "~/types/student";

function displayName(s: StudentAccountRow) {
  if (s.studentName) return s.studentName;
  const parts = [s.firstName, s.midName].filter(Boolean).join(" ");
  return parts ? `${s.lastName}, ${parts}` : s.lastName;
}

type StudentAccountTableProps = {
  students: StudentAccountRow[];
  /** Per-row login status fetched from GET /super-admin/student-accounts/<id> (the list endpoint doesn't include it); undefined while still loading. */
  accountActiveById: Record<number, boolean | undefined>;
  onView: ((student: StudentAccountRow) => void) | null;
  onEnroll: ((student: StudentAccountRow) => void) | null;
  onDeactivateAccount: ((student: StudentAccountRow) => void) | null;
  onReactivateAccount: ((student: StudentAccountRow) => void) | null;
  onArchiveProfile: ((student: StudentAccountRow) => void) | null;
  /**
   * Bulk "Create Account" selection — pass all three to render a checkbox column
   * (only for students that don't already have an account). Omit to hide it entirely.
   */
  selectedIds?: Set<number>;
  onToggleSelect?: (student: StudentAccountRow, checked: boolean) => void;
  onSelectAll?: (checked: boolean, students: StudentAccountRow[]) => void;
};

const labeledActionButtonClassName =
  "flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white";

export function StudentAccountTable({
  students,
  accountActiveById,
  onView,
  onEnroll,
  onDeactivateAccount,
  onReactivateAccount,
  onArchiveProfile,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: StudentAccountTableProps) {
  const canBulkSelect = Boolean(selectedIds && onToggleSelect && onSelectAll);
  const selectableStudents = students.filter((s) => !s.hasAccount);
  const allSelectableSelected =
    selectableStudents.length > 0 && selectableStudents.every((s) => selectedIds?.has(s.studentProfileId));

  return (
    <Table>
      <TableHead>
        {canBulkSelect && (
          <TableHeader className="w-10">
            <Checkbox
              id="student-account-select-all"
              ariaLabel="Select all students without an account"
              inset
              checked={allSelectableSelected}
              onChange={(checked) => onSelectAll?.(checked, selectableStudents)}
            />
          </TableHeader>
        )}
        <TableHeader>Student ID</TableHeader>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Program</TableHeader>
        <TableHeader className="hidden lg:table-cell">Email</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {students.map((student) => {
          const isActive = accountActiveById[student.studentProfileId];
          return (
          <TableRow key={student.studentProfileId}>
            {canBulkSelect && (
              <TableCell>
                {!student.hasAccount && (
                  <Checkbox
                    id={`student-account-select-${student.studentProfileId}`}
                    ariaLabel={`Select ${displayName(student)}`}
                    inset
                    checked={selectedIds?.has(student.studentProfileId) ?? false}
                    onChange={(checked) => onToggleSelect?.(student, checked)}
                  />
                )}
              </TableCell>
            )}
            <TableCell className="text-slate-600 dark:text-slate-300">
              {student.studentId ?? "—"}
            </TableCell>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">
                {displayName(student)}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
              {student.academics[student.academics.length - 1]?.program ?? "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-slate-500 dark:text-slate-400">
              {student.email ?? "—"}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                {onView && (
                  <button
                    type="button"
                    onClick={() => onView(student)}
                    aria-label={`View ${displayName(student)}`}
                    title="View details"
                    className={labeledActionButtonClassName}
                  >
                    <EyeIcon />
                    <span>View details</span>
                  </button>
                )}
                {onEnroll && (
                  <IconButton
                    onClick={() => onEnroll(student)}
                    label={`Enroll ${displayName(student)} for a new term`}
                    title="Enroll for a new term"
                  >
                    <GraduationCapIcon />
                  </IconButton>
                )}
                {onArchiveProfile && (
                  <button
                    type="button"
                    onClick={() => onArchiveProfile(student)}
                    aria-label={`Archive profile for ${displayName(student)}`}
                    title="Archive student profile"
                    className={archiveActionButtonClassName}
                  >
                    <ArchiveIcon />
                  </button>
                )}
                {onDeactivateAccount && onReactivateAccount && student.hasAccount && (
                  isActive === undefined ? (
                    <span className="grid size-8 place-items-center text-slate-300 dark:text-slate-600">…</span>
                  ) : isActive ? (
                    <IconButton
                      onClick={() => onDeactivateAccount(student)}
                      label={`Deactivate account for ${displayName(student)}`}
                      title="Deactivate account"
                    >
                      <UserOffIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      onClick={() => onReactivateAccount(student)}
                      label={`Reactivate account for ${displayName(student)}`}
                      title="Reactivate account"
                    >
                      <UserCheckIcon />
                    </IconButton>
                  )
                )}
              </div>
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
