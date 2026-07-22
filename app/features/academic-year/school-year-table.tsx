import { EditIcon, TrashIcon } from "~/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import type { SchoolYearOption } from "~/services/school-year.service";

type SchoolYearTableProps = {
  schoolYears: SchoolYearOption[];
  onEdit: (schoolYear: SchoolYearOption) => void;
  onDelete: (schoolYear: SchoolYearOption) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function SchoolYearTable({ schoolYears, onEdit, onDelete }: SchoolYearTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>School Year</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {schoolYears.map((sy) => (
          <TableRow key={sy.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{sy.schoolYear}</span>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(sy)}
                  aria-label={`Edit ${sy.schoolYear}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(sy)}
                  aria-label={`Delete ${sy.schoolYear}`}
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
