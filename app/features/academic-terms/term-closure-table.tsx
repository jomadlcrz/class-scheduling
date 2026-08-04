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
import { TableActionButton } from "~/features/academic-terms/table-action-button";
import type { TermClosureItem } from "~/types/term-closure";

type TermClosureTableProps = {
  terms: TermClosureItem[];
  onViewDetails: (term: TermClosureItem) => void;
  onClose: (term: TermClosureItem) => void;
  onReopen: (term: TermClosureItem) => void;
};

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
                <TableActionButton
                  onClick={() => onViewDetails(row)}
                >
                  View Details
                </TableActionButton>
                {row.actions.canClose && (
                  <TableActionButton
                    tone="amber"
                    onClick={() => onClose(row)}
                  >
                    <LockIcon size={14} />
                    Post
                  </TableActionButton>
                )}
                {row.actions.canReopen && (
                  <TableActionButton
                    tone="slate"
                    title="Reopen this term"
                    onClick={() => onReopen(row)}
                  >
                    Reopen
                  </TableActionButton>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
