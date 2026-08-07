import { Badge } from "~/components/ui/badge";
import { IconButton } from "~/components/ui/icon-button";
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
import type { WeeklyHourAllocation } from "~/types/weekly-hour-allocation";

type Props = {
  overrides: SubjectHourOverride[];
  subjects: { id: number; code: string; title: string; subjectType: string }[];
  allocations: WeeklyHourAllocation[];
  onEdit: (override: SubjectHourOverride) => void;
  onDelete: (override: SubjectHourOverride) => void;
};

function fmt(val: number): string {
  return Number.isInteger(val) ? `${val}.0` : String(val);
}

export function SubjectHourOverrideTable({ overrides, subjects, allocations, onEdit, onDelete }: Props) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Subject</TableHeader>
        <TableHeader className="hidden md:table-cell">Scope</TableHeader>
        <TableHeader className="text-center">Lec</TableHeader>
        <TableHeader className="text-center">Lab</TableHeader>
        <TableHeader className="text-center">Mtgs</TableHeader>
        <TableHeader className="text-center">Total</TableHeader>
        <TableHeader className="text-center">vs Base</TableHeader>
        <TableHeader className="hidden lg:table-cell">Note</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {overrides.map((o) => {
          const subject = subjects.find((s) => s.id === o.subjectId);
          const baseline = subject
            ? allocations.find((a) => a.subjectType === subject.subjectType) ?? null
            : null;
          const baselineTotal = baseline ? baseline.lectureHours + baseline.labHours : 0;
          const delta = o.totalWeeklyHours - baselineTotal;
          const isReduced = baseline != null && delta < -0.001;

          return (
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
                  <Badge tone="emerald">ALL SETS</Badge>
                ) : (
                  <Badge tone="navy">{o.setName ?? "—"}</Badge>
                )}
              </TableCell>
              <TableCell className="text-center tabular-nums">{fmt(o.lectureHours)}</TableCell>
              <TableCell className="text-center tabular-nums">{fmt(o.labHours)}</TableCell>
              <TableCell className="text-center">{o.meetings}</TableCell>
              <TableCell className="text-center tabular-nums">{fmt(o.totalWeeklyHours)}h</TableCell>
              <TableCell className="text-center">
                {baseline != null ? (
                  isReduced ? (
                    <span className="inline-flex items-center gap-1">
                      <Badge tone="red">reduced</Badge>
                      <span className="font-body text-xs tabular-nums text-red-600 dark:text-red-400">
                        {fmt(delta)}h
                      </span>
                    </span>
                  ) : (
                    <span className="font-body text-xs tabular-nums text-slate-400 dark:text-slate-500">
                      {delta > 0.001 ? `+${fmt(delta)}h` : "—"}
                    </span>
                  )
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">—</span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell max-w-48 truncate">
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
                  <IconButton
                    onClick={() => onEdit(o)}
                    label={`Edit override for ${o.subjectCode}`}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    variant="danger"
                    onClick={() => onDelete(o)}
                    label={`Delete override for ${o.subjectCode}`}
                    title="Delete"
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
