import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { EmptyState } from "~/components/feedback/empty-state";
import { Pagination } from "~/components/ui/pagination";
import { TableSkeleton } from "~/components/ui/skeleton";
import { TableLoadingSpinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useCachedData } from "~/hooks/use-cached-data";
import { PageHeader } from "~/layouts/page-header";
import { formatDateTime } from "~/lib/time";
import { administratorService } from "~/services/administrator.service";
import type { AdminAuditEntry } from "~/types/admin-audit";

const PAGE_SIZE = 10;

function actionTone(action: string) {
  if (action === "deactivated") return "red" as const;
  if (action === "reactivated") return "emerald" as const;
  return "slate" as const;
}

export function AdminAuditLogPage() {
  const [page, setPage] = useState(1);

  const entryKey = `admin-audit-entries:${page}`;
  const { data: entryData } = useCachedData(entryKey, () =>
    administratorService.listAuditLog(page, PAGE_SIZE),
  );
  const entries = entryData?.items ?? [];
  const total = entryData?.total ?? 0;
  const pages = entryData?.pages ?? 1;
  const loading = entryData === null;
  const changingPage = entryData !== null && entryData.page !== page;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Audit Log"
      />

      {changingPage || (loading && page > 1) ? (
        <div className="mt-4">
          <TableLoadingSpinner label="Loading audit log" />
        </div>
      ) : loading ? (
        <div className="mt-4">
          <TableSkeleton columns={5} rows={8} />
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No audit log entries">No account status changes have been recorded yet.</EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3 sm:hidden">
            {entries.map((entry) => (
              <AuditLogMobileCard key={entry.id} entry={entry} />
            ))}
          </div>

          <div className="mt-4 hidden sm:block">
            <Table>
              <TableHead>
                <TableHeader>Date &amp; time</TableHeader>
                <TableHeader>Action</TableHeader>
                <TableHeader>Account</TableHeader>
                <TableHeader>Performed by</TableHeader>
                <TableHeader>Reason</TableHeader>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(entry.occurredAt)}</TableCell>
                    <TableCell>
                      <Badge tone={actionTone(entry.action)}>
                        {entry.actionLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-navy-700 dark:text-mist-100">
                      {entry.account.display ?? "—"}
                    </TableCell>
                    <TableCell>{entry.performedBy?.display ?? "—"}</TableCell>
                    <TableCell>{entry.reason ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pages > 1 && (
            <Pagination page={page} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

function AuditLogMobileCard({ entry }: { entry: AdminAuditEntry }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Badge tone={actionTone(entry.action)}>
          {entry.actionLabel}
        </Badge>
        <time className="font-body text-xs text-slate-500 dark:text-slate-400">
          {formatDateTime(entry.occurredAt)}
        </time>
      </div>
      <p className="mt-3 font-body text-sm font-medium text-navy-700 dark:text-mist-100">
        {entry.account.display ?? "—"}
      </p>
      <dl className="mt-3 space-y-2 font-body text-sm text-slate-600 dark:text-slate-300">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Performed By</dt>
          <dd className="mt-0.5">{entry.performedBy?.display ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reason</dt>
          <dd className="mt-0.5">{entry.reason ?? "—"}</dd>
        </div>
      </dl>
    </article>
  );
}
