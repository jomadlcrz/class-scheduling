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
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

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
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(sem)}
                  aria-label={`Edit ${sem.displayName ?? sem.semester}`}
                  title={sem.canEdit === false ? "Semester cannot be edited" : "Edit"}
                  disabled={sem.canEdit === false}
                  className={`${actionButtonClassName} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <EditIcon />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
