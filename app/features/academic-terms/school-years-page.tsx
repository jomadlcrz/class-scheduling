import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertAction, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { HelpCircleIcon, PlusIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { SearchInput } from "~/components/ui/search-input";
import { TableSkeleton } from "~/components/ui/skeleton";
import { SchoolYearForm } from "~/features/academic-term/school-year-form";
import { SchoolYearTable } from "~/features/academic-term/school-year-table";
import { usePagination } from "~/hooks/use-pagination";
import { useSchoolYears } from "~/hooks/use-school-years";
import { PageHeader } from "~/layouts/page-header";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";

export function SchoolYearsPage() {
  const { schoolYears, loading, refresh } = useSchoolYears();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SchoolYearOption | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<{
    schoolYear: string;
    existsForToday?: boolean;
    expectedSchoolYear?: string | null;
  } | null>(null);

  useEffect(() => {
    schoolYearService
      .getCurrent()
      .then((current) => setCurrentCheck(current))
      .catch(() => setCurrentCheck(null));
  }, [schoolYears.length]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schoolYears;
    return schoolYears.filter((row) => row.schoolYear.toLowerCase().includes(q));
  }, [schoolYears, search]);

  const pagination = usePagination(filtered, search);
  const missingCurrentYear = currentCheck?.existsForToday === false;
  const expectedYear = currentCheck?.expectedSchoolYear;

  async function handleCreate(schoolYear: string) {
    const message = await schoolYearService.create(schoolYear);
    if (message) toast.success(message);
    setCreateOpen(false);
    await refresh();
  }

  async function handleEdit(schoolYear: string) {
    if (!editTarget) return;
    const message = await schoolYearService.update(editTarget.id, schoolYear);
    if (message) toast.success(message);
    setEditTarget(null);
    await refresh();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="School Years"

        actions={
          <>
            <Button type="button" variant="outline" block={false} onClick={() => setHelpOpen(true)}>
              <HelpCircleIcon />
              Help
            </Button>
            <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
              <PlusIcon />
              Create
            </Button>
          </>
        }
      />

      {missingCurrentYear && expectedYear && (
        <Alert variant="warning" className="mt-6">
          <AlertDescription>
            No school year exists for the current academic calendar ({expectedYear}).
          </AlertDescription>
          <AlertAction>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              Create {expectedYear}
            </Button>
          </AlertAction>
        </Alert>
      )}

      {currentCheck && !missingCurrentYear && (
        <Card className="animated-brand-border mt-6 overflow-hidden border-blue-200! bg-linear-to-br from-blue-50 via-white to-gold-300/15 px-5 py-5 shadow-lg shadow-navy-900/10 sm:px-6 dark:border-blue-400/20! dark:bg-navy-900! dark:bg-none">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-gwc-blue via-blue-500 to-gold-400" />
          <div
            aria-hidden="true"
            className="absolute -left-20 -bottom-24 size-48 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-400/5"
          />
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 size-48 rounded-full bg-gold-400/15 blur-3xl dark:bg-gold-400/10"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-gwc-blue dark:text-blue-300">
                Current School Year
              </p>
              <p className="mt-1 font-display text-4xl tracking-wide text-navy-800 dark:text-white">
                {currentCheck.schoolYear}
              </p>
            </div>
            <Badge tone="gold">Current</Badge>
          </div>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          className="w-full sm:w-56"
        />
      </div>

      <div className="mt-3">
        {loading ? (
          <TableSkeleton columns={4} rows={8} />
        ) : filtered.length === 0 ? (
          <EmptyState title={search ? "No school years found" : "No school years yet"}>
            {search ? "Try a different search term." : "Create the first school year to get started."}
          </EmptyState>
        ) : (
          <>
            <SchoolYearTable
              schoolYears={pagination.pageItems}
              onEdit={setEditTarget}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create School Year">
        <SchoolYearForm
          mode="create"
          initialValue={missingCurrentYear ? expectedYear ?? "" : ""}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit School Year">
        {editTarget && (
          <SchoolYearForm
            mode="edit"
            initialValue={editTarget.schoolYear}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="School years" wide>
        <div className="space-y-4 font-body text-sm text-slate-500 dark:text-slate-400">
          <p>
            Each row is one academic year (e.g. 2026-2027). Calendar status — Ongoing, Ended, or
            Upcoming — is computed from today&apos;s date.
          </p>
          <p>
            School years are not archived. Academic lifecycle actions are managed from the Term
            Closure page, and historical records stay available here.
          </p>
          <p>
            The current year is hoisted to the top of the list and used as the default in the global
            term selector.
          </p>
        </div>
      </Modal>
    </div>
  );
}
