import { ArchiveIcon, EditIcon } from "~/components/ui/icons";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { calendarStatusTone, StatusBadge } from "~/features/academic-terms/status-badges";
import type { SchoolYearOption } from "~/services/school-year.service";

type SchoolYearTableProps = {
  schoolYears: SchoolYearOption[];
  onEdit: (schoolYear: SchoolYearOption) => void;
  onArchive: (schoolYear: SchoolYearOption) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

function formatCreatedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function SchoolYearTable({ schoolYears, onEdit, onArchive }: SchoolYearTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>School Year</TableHeader>
        <TableHeader>Calendar Status</TableHeader>
        <TableHeader>Current</TableHeader>
        <TableHeader className="hidden md:table-cell">Created At</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {schoolYears.map((sy) => (
          <TableRow key={sy.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">{sy.schoolYear}</span>
            </TableCell>
            <TableCell>
              {sy.status ? (
                <StatusBadge tone={calendarStatusTone(sy.status)}>{sy.status}</StatusBadge>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell>
              {sy.isCurrent ? (
                <Badge tone="sky">
                  <span className="inline-flex items-center gap-1">
                    <span aria-hidden="true">★</span>
                    Current
                  </span>
                </Badge>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell">{formatCreatedAt(sy.createdAt)}</TableCell>
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
                  onClick={() => onArchive(sy)}
                  aria-label={`Archive ${sy.schoolYear}`}
                  title="Archive"
                  className={actionButtonClassName}
                >
                  <ArchiveIcon />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
