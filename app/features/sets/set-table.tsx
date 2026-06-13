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
import { PROGRAMS } from "../../services/mock-data";
import { type ClassSet } from "../../types/set";
import { YEAR_LEVEL_LABELS } from "../../types/subject";
import { getProgramTone } from "../../types/program";

type SetTableProps = {
  sets: ClassSet[];
  onEdit: (set: ClassSet) => void;
  onDelete: (set: ClassSet) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function SetTable({ sets, onEdit, onDelete }: SetTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Set</TableHeader>
        <TableHeader>Program</TableHeader>
        <TableHeader>Year Level</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {sets.map((set) => (
          <TableRow key={set.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-white">{set.setCode}</span>
            </TableCell>
            <TableCell>
              <Badge tone={getProgramTone(set.program, PROGRAMS)}>{set.program}</Badge>
            </TableCell>
            <TableCell>{YEAR_LEVEL_LABELS[set.yearLevel]}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(set)}
                  aria-label={`Edit set ${set.setCode}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(set)}
                  aria-label={`Delete set ${set.setCode}`}
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
