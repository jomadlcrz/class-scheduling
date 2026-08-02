import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { AuditLogIcon, FilterIcon, HelpCircleIcon } from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { SearchInput } from "~/components/ui/search-input";
import { Spinner } from "~/components/ui/spinner";
import { StatusBadge } from "~/features/academic-terms/status-badges";
import { TermClosureAuditLogModal } from "~/features/academic-terms/term-closure-audit-log-modal";
import { TermClosureDetailsModal } from "~/features/academic-terms/term-closure-details-modal";
import { TermClosureTable } from "~/features/academic-terms/term-closure-table";
import { usePagination } from "~/hooks/use-pagination";
import { useTermClosures } from "~/hooks/use-term-closures";
import { PageHeader } from "~/layouts/page-header";
import { termClosureService } from "~/services/term-closure.service";
import type { TermClosureItem } from "~/types/term-closure";

export function TermClosurePage() {
  const { closures, loading, refresh } = useTermClosures();
  const [search, setSearch] = useState("");
  const [schoolYear, setSchoolYear] = useState("all");
  const [semester, setSemester] = useState("all");
  const [detailsTerm, setDetailsTerm] = useState<TermClosureItem | null>(null);
  const [reopenTarget, setReopenTarget] = useState<TermClosureItem | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const schoolYearOptions = useMemo(() => {
    const values = [...new Set(closures.map((row) => row.schoolYear))].sort().reverse();
    return values.map((value) => ({ value, label: value }));
  }, [closures]);

  const semesterOptions = useMemo(() => {
    const values = [...new Set(closures.map((row) => row.semesterDisplayName))];
    return values.map((value) => ({ value, label: value }));
  }, [closures]);

  const resetKey = `${search}|${schoolYear}|${semester}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return closures.filter((row) => {
      if (schoolYear !== "all" && row.schoolYear !== schoolYear) return false;
      if (semester !== "all" && row.semesterDisplayName !== semester) return false;
      if (q && !`${row.schoolYear} ${row.semesterDisplayName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [closures, search, schoolYear, semester]);

  const pagination = usePagination(filtered, resetKey);

  async function handleReopen() {
    if (!reopenTarget) return;
    const message = await termClosureService.reopen(reopenTarget.syId, reopenTarget.semesterNumber);
    if (message) toast.success(message);
    setReopenTarget(null);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Term Closure"
        description="Close a term after posting grades. Closed terms are protected from destructive changes."
        actions={
          <Button type="button" variant="outline" block={false} onClick={() => setAuditOpen(true)}>
            <AuditLogIcon />
            View Audit Log
          </Button>
        }
      />

      <Alert variant="default" className="mt-6 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
        <HelpCircleIcon />
        <AlertDescription>
          Only the registrar can close or reopen a term. This list shows terms posted by the registrar.
        </AlertDescription>
      </Alert>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="School Year"
          allLabel="All School Years"
          options={schoolYearOptions}
          value={schoolYear}
          onChange={setSchoolYear}
        />
        <FilterDropdown
          label="Semester"
          allLabel="All Semesters"
          options={semesterOptions}
          value={semester}
          onChange={setSemester}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search term…"
          className="min-w-40 flex-1 sm:max-w-xs"
        />
        <Button type="button" variant="outline" block={false} onClick={() => toast.info("Advanced filters — coming soon.")}>
          <FilterIcon />
          Filters
        </Button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div role="status" aria-label="Loading term closures" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={closures.length === 0 ? "No terms have been posted yet" : "No terms found"}>
            {closures.length === 0
              ? "Posted terms will appear here after a registrar closes a term."
              : "No terms match the current filters."}
          </EmptyState>
        ) : (
          <>
            <TermClosureTable
              terms={pagination.pageItems}
              onViewDetails={setDetailsTerm}
              onReopen={setReopenTarget}
            />
            {pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.setPage}
              />
            )}
          </>
        )}
      </div>

      <Card className="mt-6 p-5">
        <h3 className="font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">Status Guide</h3>
        <ul className="mt-3 space-y-2 font-body text-sm text-slate-600 dark:text-slate-300">
          <li>
            <StatusBadge tone="emerald">Open</StatusBadge> — Term accepts changes.
          </li>
          <li>
            <StatusBadge tone="gold">Closed</StatusBadge> — Term is protected from destructive changes.
          </li>
          <li>
            <StatusBadge tone="slate">School Year Ended</StatusBadge> — Auto-closed on June 1; not reopenable.
          </li>
        </ul>

        <Alert variant="default" className="mt-4 border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
          <AlertTitle>Notes</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Reopen is only available for terms closed by the registrar.</li>
              <li>Terms closed due to school year end cannot be reopened.</li>
            </ul>
          </AlertDescription>
        </Alert>
      </Card>

      <TermClosureDetailsModal term={detailsTerm} onClose={() => setDetailsTerm(null)} />

      <ConfirmDialog
        open={reopenTarget !== null}
        onClose={() => setReopenTarget(null)}
        title="Reopen term"
        confirmLabel="Reopen term"
        loadingLabel="Reopening…"
        onConfirm={handleReopen}
      >
        Reopen {reopenTarget?.semesterDisplayName}, S.Y. {reopenTarget?.schoolYear}? Destructive deletes will work
        again until you post the term.
      </ConfirmDialog>

      <TermClosureAuditLogModal open={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  );
}
