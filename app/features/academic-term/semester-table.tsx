import { EditIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { StatusBadge } from "~/features/academic-terms/status-badges";
import type { Semester } from "~/types/semester";

type SemesterTableProps = {
  semesters: Semester[];
  onEdit: (semester: Semester) => void;
};

const actionButtonClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 py-1.5 font-body text-xs font-medium text-blue-700 transition-colors duration-150 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-400/30 dark:text-blue-300 dark:hover:bg-blue-400/10";

function semesterStatusTone(status: string | undefined) {
  return status === "Active" ? "emerald" : "slate";
}

export function SemesterTable({ semesters, onEdit }: SemesterTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Semester Number</TableHeader>
        <TableHeader>Display Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Description</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {semesters.map((sem) => (
          <TableRow key={sem.id}>
            <TableCell>{sem.semesterNumber}</TableCell>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">
                {sem.displayName ?? sem.semester}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{sem.description ?? "—"}</TableCell>
            <TableCell>
              <StatusBadge tone={semesterStatusTone(sem.status)}>{sem.status ?? "Active"}</StatusBadge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onEdit(sem)}
                  aria-label={`Edit ${sem.displayName ?? sem.semester}`}
                  title={sem.canEdit === false ? "Semester cannot be edited" : undefined}
                  disabled={sem.canEdit === false}
                  className={actionButtonClassName}
                >
                  <EditIcon />
                  Edit
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
