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
import { getDeptTone, type Department } from "../../types/department";

type DepartmentTableProps = {
  departments: Department[];
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function DepartmentTable({ departments, onEdit, onDelete }: DepartmentTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Code</TableHeader>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Building</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {departments.map((dept) => (
          <TableRow key={dept.id}>
            <TableCell>
              <Badge tone={getDeptTone(dept.code)}>{dept.code}</Badge>
            </TableCell>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{dept.name}</span>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{dept.buildingCode}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(dept)}
                  aria-label={`Edit ${dept.code}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(dept)}
                  aria-label={`Delete ${dept.code}`}
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
