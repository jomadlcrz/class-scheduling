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
import type { SubjectHourOverride } from "~/services/schedule.service";

type Props = {
  overrides: SubjectHourOverride[];
  onEdit: (override: SubjectHourOverride) => void;
  onDelete: (override: SubjectHourOverride) => void;
};

function fmt(val: number): string {
  return Number.isInteger(val) ? `${val}.0` : String(val);
}

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function SubjectHourOverrideTable({ overrides, onEdit, onDelete }: Props) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Subject</TableHeader>
        <TableHeader className="hidden md:table-cell">Scope</TableHeader>
        <TableHeader className="text-center">Lec</TableHeader>
        <TableHeader className="text-center">Lab</TableHeader>
        <TableHeader className="text-center">Mtgs</TableHeader>
        <TableHeader className="text-center">Total</TableHeader>
        <TableHeader className="hidden lg:table-cell">Note</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {overrides.map((o) => (
          <TableRow key={o.id}>
            <TableCell>
              <div className="min-w-0">
                <span className="font-medium text-navy-700 dark:text-mist-100">
                  {o.subjectCode ?? "—"}
                </span>
                {o.descriptiveTitle && (
                  <p className="mt-0.5 truncate font-body text-xs text-slate-400 dark:text-slate-500">
                    {o.descriptiveTitle}
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {o.scope === "all_sets" ? (
                <Badge tone="emerald">All sets</Badge>
              ) : (
                <Badge tone="navy">{o.setName ?? "—"}</Badge>
              )}
            </TableCell>
            <TableCell className="text-center tabular-nums">{fmt(o.lectureHours)}</TableCell>
            <TableCell className="text-center tabular-nums">{fmt(o.labHours)}</TableCell>
            <TableCell className="text-center">{o.meetings}</TableCell>
            <TableCell className="text-center tabular-nums">{fmt(o.totalWeeklyHours)}h</TableCell>
            <TableCell className="hidden lg:table-cell max-w-[12rem] truncate">
              {o.note ? (
                <span className="font-body text-xs text-slate-500 dark:text-slate-400" title={o.note}>
                  {o.note}
                </span>
              ) : (
                <span className="text-slate-300 dark:text-slate-600">—</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(o)}
                  aria-label={`Edit override for ${o.subjectCode}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(o)}
                  aria-label={`Delete override for ${o.subjectCode}`}
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
