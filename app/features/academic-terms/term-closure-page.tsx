import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { AuditLogIcon, FilterIcon, HelpCircleIcon } from "~/components/ui/icons";
import { Pagination } from "~/components/ui/pagination";
import { SearchInput } from "~/components/ui/search-input";
import { MOCK_TERM_CLOSURES, type MockTermClosure } from "~/features/academic-terms/mock-data";
import { StatusBadge } from "~/features/academic-terms/status-badges";
import { TermClosureAuditLogModal } from "~/features/academic-terms/term-closure-audit-log-modal";
import { TermClosureDetailsModal } from "~/features/academic-terms/term-closure-details-modal";
import { TermClosureTable } from "~/features/academic-terms/term-closure-table";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";

export function TermClosurePage() {
  const [search, setSearch] = useState("");
  const [schoolYear, setSchoolYear] = useState("all");
  const [semester, setSemester] = useState("all");
  const [status, setStatus] = useState("all");
  const [detailsTerm, setDetailsTerm] = useState<MockTermClosure | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const resetKey = `${search}|${schoolYear}|${semester}|${status}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_TERM_CLOSURES.filter((row) => {
      if (schoolYear !== "all" && row.schoolYear !== schoolYear) return false;
      if (semester !== "all" && row.semester !== semester) return false;
      if (status !== "all" && row.status !== status) return false;
      if (q && !`${row.schoolYear} ${row.semester}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, schoolYear, semester, status]);

  const pagination = usePagination(filtered, resetKey);

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
          Only the registrar can close or reopen a term. Choose a term below to see its current status and
          available actions.
        </AlertDescription>
      </Alert>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="School Year"
          allLabel="All School Years"
          options={[
            { value: "2026-2027", label: "2026-2027" },
            { value: "2025-2026", label: "2025-2026" },
            { value: "2024-2025", label: "2024-2025" },
          ]}
          value={schoolYear}
          onChange={setSchoolYear}
        />
        <FilterDropdown
          label="Semester"
          allLabel="All Semesters"
          options={[
            { value: "1st Semester", label: "1st Semester" },
            { value: "2nd Semester", label: "2nd Semester" },
          ]}
          value={semester}
          onChange={setSemester}
        />
        <FilterDropdown
          label="Status"
          allLabel="All Statuses"
          options={[
            { value: "Open", label: "Open" },
            { value: "Closed", label: "Closed" },
          ]}
          value={status}
          onChange={setStatus}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search term…"
          className="min-w-40 flex-1 sm:max-w-xs"
        />
        <Button type="button" variant="outline" block={false} onClick={() => toast.info("Filters — mock only.")}>
          <FilterIcon />
          Filters
        </Button>
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState title="No terms found">No terms match the current filters.</EmptyState>
        ) : (
          <>
            <TermClosureTable
              terms={pagination.pageItems}
              onViewDetails={setDetailsTerm}
              onReopen={() => toast.info("Reopen — mock only.")}
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
            <StatusBadge tone="slate">Closed (Year Ended)</StatusBadge> — Auto-closed on June 1; not reopenable.
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
      <TermClosureAuditLogModal open={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  );
}
