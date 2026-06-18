import { Badge } from "../../components/ui/badge";
import { EditIcon, TrashIcon } from "../../components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  ACADEMIC_YEAR_STATUS_LABELS,
  ACADEMIC_YEAR_STATUS_TONES,
  type AcademicYear,
} from "../../types/academic-year";

type AcademicYearTableProps = {
  academicYears: AcademicYear[];
  selectedId: string | null;
  onSelect: (ay: AcademicYear) => void;
  onEdit: (ay: AcademicYear) => void;
  onDelete: (ay: AcademicYear) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function AcademicYearTable({
  academicYears,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: AcademicYearTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Academic Year</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {academicYears.map((ay) => (
          <TableRow
            key={ay.id}
            className={
              selectedId === ay.id
                ? "bg-navy-50 dark:bg-white/5"
                : "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/3"
            }
            onClick={() => onSelect(ay)}
          >
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{ay.label}</span>
            </TableCell>
            <TableCell>
              <Badge tone={ACADEMIC_YEAR_STATUS_TONES[ay.status]}>
                {ACADEMIC_YEAR_STATUS_LABELS[ay.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onEdit(ay)}
                  aria-label={`Edit ${ay.label}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(ay)}
                  aria-label={`Delete ${ay.label}`}
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
