import { EditIcon, TrashIcon } from "~/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import type { Semester } from "~/types/semester";

type SemesterTableProps = {
  semesters: Semester[];
  onEdit: (semester: Semester) => void;
  onDelete: (semester: Semester) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function SemesterTable({ semesters, onEdit, onDelete }: SemesterTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Semester</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {semesters
          .slice()
          .sort((a, b) => a.semesterNumber - b.semesterNumber)
          .map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <span className="font-medium text-navy-700 dark:text-white">{s.semester}</span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    aria-label={`Edit ${s.semester}`}
                    title="Edit"
                    className={actionButtonClassName}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s)}
                    aria-label={`Delete ${s.semester}`}
                    title="Delete"
                    className={actionButtonClassName}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
