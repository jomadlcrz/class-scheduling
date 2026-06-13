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
import { getDeptTone } from "../../types/department";
import type { Program } from "../../types/program";
import { PROGRAM_TYPE_LABELS } from "../../types/program";

type ProgramTableProps = {
  programs: Program[];
  onEdit: (program: Program) => void;
  onDelete: (program: Program) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function ProgramTable({ programs, onEdit, onDelete }: ProgramTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Code</TableHeader>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Department</TableHeader>
        <TableHeader className="hidden md:table-cell">Type</TableHeader>
        <TableHeader className="hidden md:table-cell">Years</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {programs.map((prog) => (
          <TableRow key={prog.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{prog.code}</span>
            </TableCell>
            <TableCell>{prog.name}</TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge tone={getDeptTone(prog.departmentCode)}>{prog.departmentCode}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {PROGRAM_TYPE_LABELS[prog.type]}
            </TableCell>
            <TableCell className="hidden md:table-cell">{prog.lengthYears}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(prog)}
                  aria-label={`Edit ${prog.code}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(prog)}
                  aria-label={`Delete ${prog.code}`}
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
