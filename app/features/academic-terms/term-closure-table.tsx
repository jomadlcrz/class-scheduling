import { EyeIcon, LockIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { MockTermClosure } from "~/features/academic-terms/mock-data";
import { closedReasonTone, StatusBadge, termStatusTone } from "~/features/academic-terms/status-badges";

type TermClosureTableProps = {
  terms: MockTermClosure[];
  onViewDetails: (term: MockTermClosure) => void;
  onReopen: (term: MockTermClosure) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function TermClosureTable({ terms, onViewDetails, onReopen }: TermClosureTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>School Year</TableHeader>
        <TableHeader>Semester</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader className="hidden md:table-cell">Closed Reason</TableHeader>
        <TableHeader className="hidden lg:table-cell">Closed At</TableHeader>
        <TableHeader className="hidden lg:table-cell">Closed By</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {terms.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">{row.schoolYear}</span>
            </TableCell>
            <TableCell>{row.semester}</TableCell>
            <TableCell>
              <StatusBadge tone={termStatusTone(row.status)}>{row.status}</StatusBadge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {row.closedReason ? (
                <StatusBadge tone={closedReasonTone(row.closedReason)}>{row.closedReason}</StatusBadge>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="hidden lg:table-cell">{row.closedAt ?? "—"}</TableCell>
            <TableCell className="hidden lg:table-cell">{row.closedBy ?? "—"}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onViewDetails(row)}
                  aria-label={`View details for ${row.schoolYear} ${row.semester}`}
                  title="View details"
                  className={actionButtonClassName}
                >
                  <EyeIcon />
                </button>
                <button
                  type="button"
                  disabled={!row.reopenable}
                  onClick={() => onReopen(row)}
                  aria-label={`Reopen ${row.schoolYear} ${row.semester}`}
                  title={
                    !row.reopenable
                      ? row.status === "Open"
                        ? "Term is already open"
                        : "Terms closed due to school year end cannot be reopened"
                      : "Reopen this term"
                  }
                  className={actionButtonClassName}
                >
                  <LockIcon size={16} />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
