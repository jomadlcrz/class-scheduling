import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { HelpCircleIcon, PlusIcon, RefreshCwIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { SearchInput } from "~/components/ui/search-input";
import { Spinner } from "~/components/ui/spinner";
import { SchoolYearForm } from "~/features/academic-term/school-year-form";
import { SchoolYearTable } from "~/features/academic-term/school-year-table";
import { SchoolYearArchiveDialog } from "~/features/academic-term/school-year-archive-dialog";
import { usePagination } from "~/hooks/use-pagination";
import { useSchoolYears } from "~/hooks/use-school-years";
import { PageHeader } from "~/layouts/page-header";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";

export function SchoolYearsPage() {
  const { schoolYears, loading, refresh } = useSchoolYears();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SchoolYearOption | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<SchoolYearOption | null>(null);
  const [checkingCurrent, setCheckingCurrent] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<{
    schoolYear: string;
    existsForToday?: boolean;
    expectedSchoolYear?: string | null;
  } | null>(null);
  const [currentCheckError, setCurrentCheckError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schoolYears;
    return schoolYears.filter((row) => row.schoolYear.toLowerCase().includes(q));
  }, [schoolYears, search]);

  const pagination = usePagination(filtered, search);

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

  async function handleArchive(schoolYear: SchoolYearOption) {
    const message = await schoolYearService.archive(schoolYear.id, schoolYear.schoolYear);
    if (message) toast.success(message);
    setArchiveTarget(null);
    await refresh();
  }

  async function handleCheckCurrentYear() {
    setCheckingCurrent(true);
    setCurrentCheckError(null);
    try {
      const current = await schoolYearService.getCurrent();
      setCurrentCheck(current);
    } catch (err) {
      setCurrentCheck(null);
      setCurrentCheckError(err instanceof Error ? err.message : "");
    } finally {
      setCheckingCurrent(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="School Years"
        description="Create, manage, and archive school years."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Create School Year
          </Button>
        }
      />

      <Alert variant="default" className="mt-6 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
        <HelpCircleIcon />
        <AlertDescription>
          The current school year is used as the default in the global term selector. Make sure a school
          year exists for the current academic calendar.
          {currentCheck && (
            <p className="mt-1 font-medium">
              {currentCheck.existsForToday
                ? `Current calendar school year: ${currentCheck.schoolYear}.`
                : `${currentCheck.schoolYear} is the nearest active school year; ${currentCheck.expectedSchoolYear ?? "the current calendar year"} is not configured.`}
            </p>
          )}
          {currentCheckError && <p className="mt-1 text-red-700 dark:text-red-300">{currentCheckError}</p>}
        </AlertDescription>
        <AlertAction>
          <Button
            type="button"
            variant="outline"
            block={false}
            isLoading={checkingCurrent}
            loadingLabel="Checking…"
            onClick={handleCheckCurrentYear}
          >
            <RefreshCwIcon />
            Check Current Year
          </Button>
        </AlertAction>
      </Alert>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">
          School Years List
        </h2>
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
            {search
              ? "Try a different search term."
              : "Create the first school year to get started."}
          </EmptyState>
        ) : (
          <>
            <SchoolYearTable
              schoolYears={pagination.pageItems}
              onEdit={setEditTarget}
              onArchive={setArchiveTarget}
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

      <Alert variant="warning" className="mt-6">
        <HelpCircleIcon />
        <AlertTitle>Archiving a school year</AlertTitle>
        <AlertDescription>
          Archiving will hide the school year from active dropdowns and reports. All historical data will
          be preserved and remain accessible.
        </AlertDescription>
      </Alert>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create School Year">
        <SchoolYearForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit School Year">
        {editTarget && (
          <SchoolYearForm
            initialValue={editTarget.schoolYear}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <SchoolYearArchiveDialog
        schoolYear={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
      />
    </div>
  );
}
