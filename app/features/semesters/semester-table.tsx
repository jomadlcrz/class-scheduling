import { Badge } from "~/components/ui/badge";
import { EditIcon, TrashIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  ACADEMIC_SEMESTER_STATUS_LABELS,
  ACADEMIC_SEMESTER_STATUS_TONES,
  type AcademicSemester,
} from "~/types/semester";
import { SEMESTER_LABELS } from "~/types/subject";

type SemesterTableProps = {
  semesters: AcademicSemester[];
  onEdit: (sem: AcademicSemester) => void;
  onDelete: (sem: AcademicSemester) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function SemesterTable({ semesters, onEdit, onDelete }: SemesterTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Semester</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {semesters.map((sem) => (
          <TableRow key={sem.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">
                {SEMESTER_LABELS[sem.semester]}
              </span>
            </TableCell>
            <TableCell>
              <Badge tone={ACADEMIC_SEMESTER_STATUS_TONES[sem.status]}>
                {ACADEMIC_SEMESTER_STATUS_LABELS[sem.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(sem)}
                  aria-label={`Edit ${SEMESTER_LABELS[sem.semester]}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(sem)}
                  aria-label={`Delete ${SEMESTER_LABELS[sem.semester]}`}
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
