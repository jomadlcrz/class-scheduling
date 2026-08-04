import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertAction, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { HelpCircleIcon, PlusIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { SearchInput } from "~/components/ui/search-input";
import { Spinner } from "~/components/ui/spinner";
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="School Years"
        description="Create and manage the academic years used to organize semesters and schedules."
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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search school year…"
          className="w-full sm:w-56"
        />
      </div>

      <div className="mt-3">
        {loading ? (
          <div role="status" aria-label="Loading school years" className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={search ? "No school years found" : "No school years yet"}>
            {search ? "Try a different search term." : "Create the first school year to get started."}
          </EmptyState>
        ) : (
          <>
            <SchoolYearTable schoolYears={pagination.pageItems} onEdit={setEditTarget} />
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
        <div className="space-y-4 font-body text-sm text-slate-600 dark:text-slate-300">
          <p>
            Each row is one academic year (e.g. 2026-2027). Calendar status — Ongoing, Ended, or
            Upcoming — is computed from today&apos;s date.
          </p>
          <p>
            School years are not archived. After both semesters are posted, close the year from{" "}
            <strong>Term Closure</strong>. Historical records stay available.
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
