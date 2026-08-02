import { LockIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { closedReasonTone, StatusBadge, termStatusTone } from "~/features/academic-terms/status-badges";
import type { TermClosureItem } from "~/types/term-closure";

type TermClosureTableProps = {
  terms: TermClosureItem[];
  onViewDetails: (term: TermClosureItem) => void;
  onReopen: (term: TermClosureItem) => void;
};

const actionButtonClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-body text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50";

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
          <TableRow key={`${row.syId}-${row.semId}`}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">{row.schoolYear}</span>
            </TableCell>
            <TableCell>{row.semesterDisplayName}</TableCell>
            <TableCell>
              <StatusBadge tone={termStatusTone(row.status)}>{row.status}</StatusBadge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {row.closedReasonLabel ? (
                <StatusBadge tone={closedReasonTone(row.closedReason)}>{row.closedReasonLabel}</StatusBadge>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="hidden lg:table-cell">{row.closedAtDisplay ?? "—"}</TableCell>
            <TableCell className="hidden lg:table-cell">{row.closedBy?.display ?? "—"}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetails(row)}
                  className={`${actionButtonClassName} border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-400/30 dark:text-blue-300 dark:hover:bg-blue-400/10`}
                >
                  View Details
                </button>
                <button
                  type="button"
                  disabled={!row.actions.canReopen}
                  title={
                    !row.actions.canReopen
                      ? row.status === "Open"
                        ? "Term is already open"
                        : "Terms closed due to school year end cannot be reopened"
                      : "Reopen this term"
                  }
                  onClick={() => onReopen(row)}
                  className={`${actionButtonClassName} border-red-200 text-red-700 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10`}
                >
                  <LockIcon size={14} />
                  Reopen
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
