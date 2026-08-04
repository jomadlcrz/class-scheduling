import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { AuditLogIcon, HelpCircleIcon } from "~/components/ui/icons";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { SearchInput } from "~/components/ui/search-input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { StatusBadge } from "~/features/academic-terms/status-badges";
import { TermCloseDialog } from "~/features/academic-terms/term-close-dialog";
import { TermClosureAuditLogModal } from "~/features/academic-terms/term-closure-audit-log-modal";
import { TermClosureDetailsDrawer } from "~/features/academic-terms/term-closure-details-drawer";
import { TermClosureTable } from "~/features/academic-terms/term-closure-table";
import { TermWorkflowCard } from "~/features/academic-terms/term-workflow-card";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { usePagination } from "~/hooks/use-pagination";
import { useTermClosures } from "~/hooks/use-term-closures";
import { PageHeader } from "~/layouts/page-header";
import { termClosureService } from "~/services/term-closure.service";
import type { TermClosureItem } from "~/types/term-closure";

export function TermClosurePage() {
  const { closures, loading, refresh } = useTermClosures();
  const { context: selectedContext, refresh: refreshSelectedTerm } = useTermContext();
  const [search, setSearch] = useState("");
  const [schoolYear, setSchoolYear] = useState("all");
  const [semester, setSemester] = useState("all");
  const [detailsTerm, setDetailsTerm] = useState<TermClosureItem | null>(null);
  const [closeTarget, setCloseTarget] = useState<TermClosureItem | null>(null);
  const [reopenTarget, setReopenTarget] = useState<TermClosureItem | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [auditOpen, setAuditOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const terms = useMemo(() => {
    const selected = selectedContext?.term;
    if (!selected) return closures;
    return [selected, ...closures.filter((row) => row.syId !== selected.syId || row.semId !== selected.semId)];
  }, [closures, selectedContext]);

  const schoolYearOptions = useMemo(() => {
    const values = [...new Set(terms.map((row) => row.schoolYear))].sort().reverse();
    return values.map((value) => ({ value, label: value }));
  }, [terms]);

  const semesterOptions = useMemo(() => {
    const values = [...new Set(terms.map((row) => row.semesterDisplayName))];
    return values.map((value) => ({ value, label: value }));
  }, [terms]);

  const resetKey = `${search}|${schoolYear}|${semester}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return terms.filter((row) => {
      if (schoolYear !== "all" && row.schoolYear !== schoolYear) return false;
      if (semester !== "all" && row.semesterDisplayName !== semester) return false;
      if (q && !`${row.schoolYear} ${row.semesterDisplayName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [terms, search, schoolYear, semester]);

  const pagination = usePagination(filtered, resetKey);

  async function afterChange(message: string) {
    if (message) toast.success(message);
    await Promise.all([refresh(), refreshSelectedTerm()]);
  }

  async function handleClose(reason: string) {
    if (!closeTarget) return;
    const message = await termClosureService.close(
      closeTarget.syId,
      closeTarget.semesterNumber,
      reason || undefined,
    );
    setCloseTarget(null);
    await afterChange(message);
  }

  async function handleReopen() {
    if (!reopenTarget) return;
    const message = await termClosureService.reopen(
      reopenTarget.syId,
      reopenTarget.semesterNumber,
      reopenReason.trim() || undefined,
    );
    setReopenTarget(null);
    setReopenReason("");
    await afterChange(message);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Term Closure"
        actions={
          <>
            <Button type="button" variant="outline" block={false} onClick={() => setHelpOpen(true)}>
              <HelpCircleIcon />
              Help
            </Button>
            <Button type="button" variant="outline" block={false} onClick={() => setAuditOpen(true)}>
              <AuditLogIcon />
              Audit log
            </Button>
          </>
        }
      />

      <div className="mt-6">
        <TermWorkflowCard onChanged={refresh} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
          Closure history
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="School Year"
            allLabel="All years"
            options={schoolYearOptions}
            value={schoolYear}
            onChange={setSchoolYear}
          />
          <FilterDropdown
            label="Semester"
            allLabel="All semesters"
            options={semesterOptions}
            value={semester}
            onChange={setSemester}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search…"
            className="w-40"
          />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div role="status" aria-label="Loading term closures" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={terms.length === 0 ? "No terms posted yet" : "No matches"}>
            {terms.length === 0
              ? "Post a semester from the workflow above when grades are finalized."
              : "Try different filters."}
          </EmptyState>
        ) : (
          <>
            <TermClosureTable
              terms={pagination.pageItems}
              onViewDetails={setDetailsTerm}
              onClose={setCloseTarget}
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

      <TermClosureDetailsDrawer term={detailsTerm} onClose={() => setDetailsTerm(null)} />

      <TermCloseDialog
        open={closeTarget !== null}
        syId={closeTarget?.syId ?? null}
        semesterNumber={closeTarget?.semesterNumber ?? null}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleClose}
      />

      <ConfirmDialog
        open={reopenTarget !== null}
        onClose={() => {
          setReopenTarget(null);
          setReopenReason("");
        }}
        title="Reopen term"
        confirmLabel="Reopen term"
        loadingLabel="Reopening…"
        onConfirm={handleReopen}
      >
        <p>
          Reopen {reopenTarget?.semesterDisplayName}, S.Y. {reopenTarget?.schoolYear}? Destructive
          deletes will work again until you post the term.
        </p>
        <div className="mt-4">
          <Textarea
            id="history-reopen-reason"
            label="Reason for reopening"
            value={reopenReason}
            onChange={(event) => setReopenReason(event.target.value)}
            placeholder="Optional notes for the audit trail"
          />
        </div>
      </ConfirmDialog>

      <TermClosureAuditLogModal open={auditOpen} onClose={() => setAuditOpen(false)} />

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Term closure" wide>
        <div className="space-y-5 font-body text-sm text-slate-600 dark:text-slate-300">
          <p>
            Post a term when grades are finalized. This blocks destructive deletes for that semester
            while views and reports still work.
          </p>
          <div>
            <p className="mb-2 font-medium text-navy-700 dark:text-mist-100">Status badges</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <StatusBadge tone="emerald">Open</StatusBadge>
                <span>Accepts changes.</span>
              </li>
              <li className="flex items-center gap-2">
                <StatusBadge tone="gold">Closed — Posted</StatusBadge>
                <span>Registrar posted; reopen while the school year runs.</span>
              </li>
              <li className="flex items-center gap-2">
                <StatusBadge tone="slate">Closed — Year ended</StatusBadge>
                <span>Calendar ended on June 1; not reopenable.</span>
              </li>
            </ul>
          </div>
          <p>
            Workflow: post 1st semester → run 2nd semester → post 2nd semester → close school year.
          </p>
        </div>
      </Modal>
    </div>
  );
}
