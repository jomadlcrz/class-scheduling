import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { EditIcon, TrashIcon } from "~/components/ui/icons";

export type FacultyLoadRow = {
  key: string;
  fullName: string;
  programs: string[];
  subjectCount: number;
  totalUnits: number;
  /** Only present for staged/pending rows — GET /deans/faculty-loading never returns it. */
  maxWeeklyHours?: number;
};

type FacultyLoadTableProps = {
  rows: FacultyLoadRow[];
  /** Omit both to render a read-only table (used for already-saved loads). */
  onEdit?: (key: string) => void;
  onRemove?: (key: string) => void;
};

/** Shared table for both the staged batch (editable) and existing saved loads (read-only). */
export function FacultyLoadTable({ rows, onEdit, onRemove }: FacultyLoadTableProps) {
  const editable = Boolean(onEdit || onRemove);

  return (
    <Table>
      <TableHead>
        <TableHeader>Faculty</TableHeader>
        <TableHeader>Programs</TableHeader>
        <TableHeader>Subjects</TableHeader>
        <TableHeader>Units</TableHeader>
        <TableHeader className="hidden sm:table-cell">Max Weekly Hours</TableHeader>
        {editable && <TableHeader className="text-right">Actions</TableHeader>}
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">{row.fullName}</span>
            </TableCell>
            <TableCell className="text-slate-600 dark:text-slate-300">
              {row.programs.join(", ") || "—"}
            </TableCell>
            <TableCell className="text-slate-600 dark:text-slate-300">{row.subjectCount}</TableCell>
            <TableCell className="text-slate-600 dark:text-slate-300">{row.totalUnits}</TableCell>
            <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
              {row.maxWeeklyHours != null ? `${row.maxWeeklyHours} hrs` : "—"}
            </TableCell>
            {editable && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(row.key)}
                      aria-label={`Edit ${row.fullName}`}
                      className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <EditIcon />
                    </button>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(row.key)}
                      aria-label={`Remove ${row.fullName}`}
                      className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
