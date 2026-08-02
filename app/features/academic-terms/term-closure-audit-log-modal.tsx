import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { HelpCircleIcon, LockIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { termClosureService } from "~/services/term-closure.service";
import type { TermAuditLogEntry, TermAuditLogFilters } from "~/types/term-closure";

type TermClosureAuditLogModalProps = {
  open: boolean;
  onClose: () => void;
};

function auditActionTone(action: string) {
  if (action === "term_closed") return "gold" as const;
  if (action === "term_reopened") return "emerald" as const;
  return "slate" as const;
}

export function TermClosureAuditLogModal({ open, onClose }: TermClosureAuditLogModalProps) {
  const [filters, setFilters] = useState<TermAuditLogFilters | null>(null);
  const [entries, setEntries] = useState<TermAuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [schoolYear, setSchoolYear] = useState("all");
  const [semester, setSemester] = useState("all");
  const [action, setAction] = useState("all");
  const [performedBy, setPerformedBy] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!open) return;
    setLoadingFilters(true);
    termClosureService
      .auditLogFilters()
      .then(setFilters)
      .catch(() => setFilters(null))
      .finally(() => setLoadingFilters(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoadingEntries(true);
    termClosureService
      .listAuditLog({
        syId: schoolYear !== "all" ? Number(schoolYear) : undefined,
        semesterNumber: semester !== "all" ? Number(semester) : undefined,
        action: action !== "all" ? action : undefined,
        performedBy: performedBy !== "all" ? Number(performedBy) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        perPage: pageSize,
      })
      .then((result) => {
        setEntries(result.items);
        setTotal(result.total);
        setPages(result.pages);
      })
      .catch(() => {
        setEntries([]);
        setTotal(0);
        setPages(1);
      })
      .finally(() => setLoadingEntries(false));
  }, [open, schoolYear, semester, action, performedBy, dateFrom, dateTo, page]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const schoolYearOptions = useMemo(
    () => filters?.schoolYears.map((row) => ({ value: String(row.id), label: row.schoolYear })) ?? [],
    [filters],
  );

  const semesterOptions = useMemo(
    () =>
      filters?.semesters.map((row) => ({
        value: String(row.semesterNumber),
        label: row.displayName,
      })) ?? [],
    [filters],
  );

  const actionOptions = useMemo(() => filters?.actions ?? [], [filters]);

  const performerOptions = useMemo(
    () => filters?.performers.map((row) => ({ value: String(row.userId), label: row.display })) ?? [],
    [filters],
  );

  function resetFilters() {
    setSchoolYear("all");
    setSemester("all");
    setAction("all");
    setPerformedBy("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <Modal open={open} onClose={onClose} title="Term Closure Audit Log" xl>
      <p className="font-body text-sm text-slate-500 dark:text-slate-400">
        Complete history of actions performed on term closures.
      </p>

      {loadingFilters ? (
        <div role="status" aria-label="Loading audit log filters" className="mt-4 grid place-items-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="School Year"
            allLabel="All School Years"
            options={schoolYearOptions}
            value={schoolYear}
            onChange={(value) => {
              setSchoolYear(value);
              setPage(1);
            }}
          />
          <FilterDropdown
            label="Semester"
            allLabel="All Semesters"
            options={semesterOptions}
            value={semester}
            onChange={(value) => {
              setSemester(value);
              setPage(1);
            }}
          />
          <FilterDropdown
            label="Action"
            allLabel="All Actions"
            options={actionOptions}
            value={action}
            onChange={(value) => {
              setAction(value);
              setPage(1);
            }}
          />
          <FilterDropdown
            label="Performed By"
            allLabel="All Users"
            options={performerOptions}
            value={performedBy}
            onChange={(value) => {
              setPerformedBy(value);
              setPage(1);
            }}
          />
          <label className="flex items-center gap-1.5 font-body text-xs text-slate-500 dark:text-slate-400">
            <span>From</span>
            <input
              type="date"
              aria-label="Audit log start date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              className={`${inputClassName} w-auto py-1.5`}
            />
          </label>
          <label className="flex items-center gap-1.5 font-body text-xs text-slate-500 dark:text-slate-400">
            <span>To</span>
            <input
              type="date"
              aria-label="Audit log end date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              className={`${inputClassName} w-auto py-1.5`}
            />
          </label>
          <Button type="button" variant="outline" block={false} onClick={resetFilters}>
            Reset
          </Button>
        </div>
      )}

      <Alert
        variant="default"
        className="mt-4 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200"
      >
        <HelpCircleIcon />
        <AlertDescription>
          Showing {rangeStart} to {rangeEnd} of {total} audit log entries
        </AlertDescription>
      </Alert>

      {loadingEntries ? (
        <div role="status" aria-label="Loading audit log" className="mt-4 grid place-items-center py-12">
          <Spinner />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState title="No audit log entries">No entries match the current filters.</EmptyState>
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
                <TableHeader>Date &amp; Time</TableHeader>
                <TableHeader>Action</TableHeader>
                <TableHeader>Term (School Year / Semester)</TableHeader>
                <TableHeader>Performed By</TableHeader>
                <TableHeader className="hidden lg:table-cell">Role</TableHeader>
                <TableHeader className="hidden md:table-cell">IP Address</TableHeader>
                <TableHeader>Details</TableHeader>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">{entry.occurredAtDisplay ?? "—"}</TableCell>
                    <TableCell>
                      <Badge tone={auditActionTone(entry.action)}>
                        <span className="inline-flex items-center gap-1">
                          {entry.action === "term_closed" ? <LockIcon size={14} /> : null}
                          {entry.actionLabel}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.termDisplay ?? "—"}</TableCell>
                    <TableCell>{entry.performedByDisplay ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{entry.role ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{entry.ipAddress ?? "—"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-start gap-1">
                        {entry.details ?? "—"}
                        <HelpCircleIcon />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pages > 1 && (
            <Pagination page={page} totalItems={total} pageSize={pageSize} onPageChange={setPage} />
          )}
        </>
      )}

      <div className="mt-4 flex justify-end border-t border-slate-200 pt-4 dark:border-white/10">
        <Button type="button" variant="outline" block={false} onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

function AuditLogMobileCard({ entry }: { entry: TermAuditLogEntry }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Badge tone={auditActionTone(entry.action)}>{entry.actionLabel}</Badge>
        <time className="font-body text-xs text-slate-500 dark:text-slate-400">{entry.occurredAtDisplay ?? "—"}</time>
      </div>
      <p className="mt-3 font-body text-sm font-medium text-navy-700 dark:text-mist-100">{entry.termDisplay ?? "—"}</p>
      <dl className="mt-3 space-y-2 font-body text-sm text-slate-600 dark:text-slate-300">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Performed By</dt>
          <dd className="mt-0.5">{entry.performedByDisplay ?? "—"}</dd>
        </div>
        {entry.role && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role</dt>
            <dd className="mt-0.5">{entry.role}</dd>
          </div>
        )}
        {entry.ipAddress && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">IP Address</dt>
            <dd className="mt-0.5">{entry.ipAddress}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Details</dt>
          <dd className="mt-0.5">{entry.details ?? "—"}</dd>
        </div>
      </dl>
    </article>
  );
}
