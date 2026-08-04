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
  onClose: (term: TermClosureItem) => void;
  onReopen: (term: TermClosureItem) => void;
};

const actionButtonClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-body text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50";

export function TermClosureTable({ terms, onViewDetails, onClose, onReopen }: TermClosureTableProps) {
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
          <TableRow key={`${row.syId}-${row.semesterNumber}`}>
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
                {row.actions.canClose && (
                  <button
                    type="button"
                    onClick={() => onClose(row)}
                    className={`${actionButtonClassName} border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-gold-400/30 dark:text-gold-300 dark:hover:bg-gold-400/10`}
                  >
                    <LockIcon size={14} />
                    Post
                  </button>
                )}
                {row.actions.canReopen && (
                  <button
                    type="button"
                    title="Reopen this term"
                    onClick={() => onReopen(row)}
                    className={`${actionButtonClassName} border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10`}
                  >
                    Reopen
                  </button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
