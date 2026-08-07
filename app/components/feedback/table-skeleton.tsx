import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type TableSkeletonProps = {
  /** How many columns the real table has — keeps the placeholder the same shape. */
  columns: number;
  /** Placeholder row count (default 6). */
  rows?: number;
};

/** Table-shaped loading placeholder — preserves layout so content doesn't jump
 * in on load, matching the shaped skeletons the dashboards already use. */
export function TableSkeleton({ columns, rows = 6 }: TableSkeletonProps) {
  return (
    <div role="status" aria-label="Loading">
      <div aria-hidden="true">
        <Table>
          <TableHead>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHeader key={i}>
                <Skeleton className="h-3.5 w-16" />
              </TableHeader>
            ))}
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }).map((_, r) => (
              <TableRow key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
