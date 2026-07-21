import {
  ACADEMIC_PERIOD_STATUS_LABELS,
  ACADEMIC_PERIOD_STATUS_TONES,
  type AcademicPeriodStatus,
} from "~/features/academic-year/academic-year-status";
import { Badge } from "~/components/ui/badge";
import { EditIcon, TrashIcon } from "~/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";

export type AcademicPeriodRow = {
  id: number;
  schoolYear: string;
  semester: string;
  semesterNumber: number;
  status: AcademicPeriodStatus;
};

type AcademicPeriodTableProps = {
  periods: AcademicPeriodRow[];
  onEdit: (period: AcademicPeriodRow) => void;
  onDelete: (period: AcademicPeriodRow) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function AcademicPeriodTable({ periods, onEdit, onDelete }: AcademicPeriodTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>School Year</TableHeader>
        <TableHeader>Semester</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {periods.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{p.schoolYear}</span>
            </TableCell>
            <TableCell>{p.semester}</TableCell>
            <TableCell>
              <Badge tone={ACADEMIC_PERIOD_STATUS_TONES[p.status]}>
                {ACADEMIC_PERIOD_STATUS_LABELS[p.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(p)}
                  aria-label={`Edit ${p.schoolYear} ${p.semester}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p)}
                  aria-label={`Delete ${p.schoolYear} ${p.semester}`}
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
