import { EditIcon } from "~/components/ui/icons";
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
};

const actionButtonClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-body text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400";

function formatCreatedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function SchoolYearTable({ schoolYears, onEdit }: SchoolYearTableProps) {
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
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(sy)}
                  aria-label={`Edit ${sy.schoolYear}`}
                  className={`${actionButtonClassName} border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-400/30 dark:text-blue-300 dark:hover:bg-blue-400/10`}
                >
                  <EditIcon />
                  Edit
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
