import { useEffect, useMemo, useState } from "react";
import { useBlocker } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { Button } from "~/components/ui/button";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { FacultyAssignmentForm } from "~/features/faculty/faculty-assignment";
import {
  FacultyLoadTable,
  toExistingFacultyLoadRow,
  toFacultyLoadRow,
  type FacultyLoadRow,
} from "~/features/faculty/faculty-load-table";
import { FacultyLoadSubjectsModal } from "~/features/faculty/faculty-load-subjects-modal";
import { usePagination } from "~/hooks/use-pagination";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { facultyKey, flattenDepartmentSubjects } from "~/lib/faculty-load";
import { facultyLoadService } from "~/services/faculty-load.service";
import type {
  DepartmentFacultyOption,
  DepartmentSubjectProgram,
  FacultyLoadInput,
  FacultyLoadingEntry,
} from "~/types/faculty-load";

export function meta() {
  return [
    { title: "Faculty Loads — GWC Class Scheduling" },
    { name: "description", content: "Assign faculty to subjects for a school year and semester." },
  ];
}

export default function FacultyLoadsRoute() {
  return (
    <RoleGuard allow={["dean"]}>
      <FacultyLoadsPage />
    </RoleGuard>
  );
}

function FacultyLoadsPage() {
  const { schoolYears, defaultSchoolYear } = useSchoolYears();
  const { semesters, semesterLabel } = useSemesters();

  const [schoolYearId, setSchoolYearId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const [faculties, setFaculties] = useState<DepartmentFacultyOption[] | null>(null);
  const [subjectPrograms, setSubjectPrograms] = useState<DepartmentSubjectProgram[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [existingLoads, setExistingLoads] = useState<FacultyLoadingEntry[] | null>(null);
  const [termError, setTermError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [pending, setPending] = useState<FacultyLoadInput[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<FacultyLoadRow | null>(null);

  // Department roster + curriculum are independent of the selected term.
  useEffect(() => {
    Promise.all([facultyLoadService.listDepartmentFaculties(), facultyLoadService.listDepartmentSubjects()])
      .then(([facultyList, subjectList]) => {
        setFaculties(facultyList);
        setSubjectPrograms(subjectList);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to load department data.");
        setFaculties([]);
        setSubjectPrograms([]);
      });
  }, []);

  // Default to the current school year once it's known.
  useEffect(() => {
    if (schoolYearId || schoolYears.length === 0) return;
    const match = schoolYears.find((s) => s.schoolYear === defaultSchoolYear) ?? schoolYears[0];
    if (match) setSchoolYearId(String(match.id));
  }, [schoolYears, defaultSchoolYear, schoolYearId]);

  useEffect(() => {
    if (semesterId || semesters.length === 0) return;
    const first = semesters.find((s) => s.semesterNumber !== 3) ?? semesters[0];
    if (first) setSemesterId(String(first.id));
  }, [semesters, semesterId]);

  const matchedSy = schoolYears.find((s) => String(s.id) === schoolYearId);
  const matchedSem = semesters.find((s) => String(s.id) === semesterId);

  // GET /deans/faculty-loading requires sy_id + sem_id, so it can only run once a term is picked.
  useEffect(() => {
    if (!matchedSy || !matchedSem) return;
    let cancelled = false;
    setExistingLoads(null);
    setTermError(null);
    facultyLoadService
      .getFacultyLoading(matchedSy.id, matchedSem.id)
      .then((data) => {
        if (!cancelled) setExistingLoads(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setTermError(err instanceof Error ? err.message : "Unable to load existing faculty loads.");
        setExistingLoads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [matchedSy?.id, matchedSem?.id]);

  const termLoads = existingLoads ?? [];

  const visibleTermLoads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return termLoads;
    return termLoads.filter((entry) => entry.instructorName.toLowerCase().includes(query));
  }, [termLoads, search]);

  const pagination = usePagination(
    visibleTermLoads,
    `${matchedSy?.id ?? ""}|${matchedSem?.id ?? ""}|${search}`,
  );

  const unitsByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const choice of flattenDepartmentSubjects(subjectPrograms ?? [])) {
      map.set(choice.key, choice.units);
    }
    return map;
  }, [subjectPrograms]);

  const isDirty = pending.length > 0;

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSaving && currentLocation.pathname !== nextLocation.pathname,
  );

  const editingEntry = editingKey
    ? pending.find((p) => facultyKey(p.firstName, p.lastName) === editingKey)
    : undefined;

  function openAddForm() {
    setEditingKey(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingKey(null);
  }

  function handleAddOrUpdate(entry: FacultyLoadInput) {
    const key = facultyKey(entry.firstName, entry.lastName);
    setPending((current) => {
      const exists = current.some((p) => facultyKey(p.firstName, p.lastName) === key);
      return exists
        ? current.map((p) => (facultyKey(p.firstName, p.lastName) === key ? entry : p))
        : [...current, entry];
    });
    closeForm();
  }

  function handleEditRow(key: string) {
    setEditingKey(key);
    setFormOpen(true);
  }

  function confirmRemove() {
    if (!removeTarget) return;
    setPending((current) => current.filter((p) => facultyKey(p.firstName, p.lastName) !== removeTarget));
    setRemoveTarget(null);
  }

  async function handleSaveAll() {
    if (!matchedSy || !matchedSem || pending.length === 0) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      const message = await facultyLoadService.createSubjectAssignments(matchedSy.id, matchedSem.id, pending);
      if (message) toast.success(message);
      setPending([]);
      const refreshed = await facultyLoadService.getFacultyLoading(matchedSy.id, matchedSem.id);
      setExistingLoads(refreshed);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const isLoading = faculties === null || subjectPrograms === null;
  const contextReady = Boolean(matchedSy && matchedSem);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Faculty Loads"
        description="Assign department faculty to subjects for a school year and semester."
        actions={
          <>
            <Button
              type="button"
              block={false}
              disabled={!contextReady || isLoading}
              onClick={openAddForm}
            >
              <PlusIcon />
              Add Faculty Load
            </Button>
            {pending.length > 0 && (
              <Button
                type="button"
                block={false}
                isLoading={isSaving}
                loadingLabel="Saving…"
                onClick={handleSaveAll}
              >
                Save All ({pending.length})
              </Button>
            )}
          </>
        }
      />

      {isLoading ? (
        <div
          role="status"
          aria-label="Loading faculty loads"
          className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : loadError ? (
        <ResultState tone="error" title="Unable to load">
          {loadError}
        </ResultState>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {saveError && (
            <ResultState tone="error" title="Unable to save">
              {saveError}
            </ResultState>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Select
                items={schoolYears.map((s) => ({ value: String(s.id), label: s.schoolYear }))}
                value={schoolYearId}
                onValueChange={(v) => setSchoolYearId(v as string)}
              >
                <SelectTrigger id="fl-school-year" aria-label="School Year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.schoolYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select
                items={semesters
                  .filter((s) => s.semesterNumber !== 3)
                  .map((s) => ({ value: String(s.id), label: semesterLabel(s.semesterNumber) }))}
                value={semesterId}
                onValueChange={(v) => setSemesterId(v as string)}
              >
                <SelectTrigger id="fl-semester" aria-label="Semester">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {semesters
                    .filter((s) => s.semesterNumber !== 3)
                    .map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {semesterLabel(s.semesterNumber)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative order-first w-full sm:order-0 sm:ml-auto sm:w-64">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <SearchIcon />
              </span>
              <input
                id="faculty-load-search"
                type="search"
                placeholder="Faculty name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search"
                className={`${inputClassName} pl-9 pr-4`}
              />
            </div>
          </div>

          {pending.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
                Staged for this save
              </h2>
              <FacultyLoadTable
                rows={pending.map((entry) => toFacultyLoadRow(entry, unitsByKey))}
                onEdit={handleEditRow}
                onRemove={(key) => setRemoveTarget(key)}
                onViewSubjects={setViewTarget}
              />
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
              Existing Faculty Loads
            </h2>
            {!contextReady ? (
              <EmptyState title="Select a term">
                Pick a school year and semester to see existing faculty loads.
              </EmptyState>
            ) : existingLoads === null ? (
              <div
                role="status"
                aria-label="Loading existing faculty loads"
                className="grid place-items-center py-8 text-navy-700 dark:text-slate-200"
              >
                <Spinner />
              </div>
            ) : termError ? (
              <ResultState tone="error" title="Unable to load">
                {termError}
              </ResultState>
            ) : termLoads.length === 0 ? (
              <EmptyState title="No faculty loads yet">
                No faculty have been assigned subjects for this term yet.
              </EmptyState>
            ) : visibleTermLoads.length === 0 ? (
              <EmptyState title="No faculty found">
                No faculty match "{search}". Try a different search.
              </EmptyState>
            ) : (
              <>
                <FacultyLoadTable
                  rows={pagination.pageItems.map(toExistingFacultyLoadRow)}
                  onViewSubjects={setViewTarget}
                />
                <Pagination
                  page={pagination.page}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                />
              </>
            )}
          </section>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingEntry ? "Edit Faculty Load" : "Add Faculty Load"}
        wide
      >
        <FacultyAssignmentForm
          key={editingKey ?? "new"}
          initialEntry={editingEntry}
          faculties={faculties ?? []}
          subjectPrograms={subjectPrograms ?? []}
          existingLoads={termLoads}
          stagedKeys={pending.map((p) => facultyKey(p.firstName, p.lastName))}
          onAdd={handleAddOrUpdate}
          onCancelEdit={editingEntry ? closeForm : undefined}
        />
      </Modal>

      <Modal
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title={viewTarget ? `Subjects — ${viewTarget.fullName}` : "Subjects"}
      >
        {viewTarget && <FacultyLoadSubjectsModal row={viewTarget} />}
      </Modal>

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="Remove faculty load"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={async () => confirmRemove()}
      >
        This staged faculty load will be removed from the batch before it's saved.
      </ConfirmDialog>

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved faculty loads?"
        confirmLabel="Discard"
        loadingLabel="Discarding…"
        confirmVariant="danger"
        onConfirm={async () => blocker.proceed?.()}
      >
        You have staged faculty loads that haven't been saved. Leaving this page will discard them.
      </ConfirmDialog>
    </div>
  );
}
