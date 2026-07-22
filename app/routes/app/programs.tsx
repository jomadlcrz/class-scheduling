import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { ProgramForm } from "~/features/programs/program-form";
import { ProgramTable } from "~/features/programs/program-table";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { departmentService } from "~/services/department.service";
import { programService } from "~/services/program.service";
import type { Department } from "~/types/department";
import type { CreateProgramInput, Program } from "~/types/program";
import { PROGRAM_TYPES } from "~/types/program";

export function meta() {
  return [
    { title: "Programs — GWC Class Scheduling" },
    { name: "description", content: "Manage academic programs." },
  ];
}

export default function Programs() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <ProgramsPage />
    </RoleGuard>
  );
}

function ProgramsPage() {
  const [programsList, setProgramsList] = useState<Program[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Program | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  useEffect(() => {
    programService.list().then(setProgramsList).catch(() => setProgramsList([]));
    departmentService.list().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const resetKey = `${search}|${deptFilter}|${typeFilter}`;

  const visiblePrograms = useMemo(() => {
    if (!programsList) return [];
    const q = search.trim().toLowerCase();
    return programsList
      .filter((p) => {
        if (deptFilter !== "all" && p.departmentAbbrev !== deptFilter) return false;
        if (typeFilter !== "all" && p.type !== typeFilter) return false;
        if (q && !p.abbrev.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          a.departmentAbbrev.localeCompare(b.departmentAbbrev) || a.abbrev.localeCompare(b.abbrev),
      );
  }, [programsList, search, deptFilter, typeFilter]);

  const pagination = usePagination(visiblePrograms, resetKey);

  // Mutations return only a message, so the list is refetched afterwards.
  async function refresh() {
    setProgramsList(await programService.list());
  }

  async function handleCreate(input: CreateProgramInput) {
    const message = await programService.create(input);
    if (message) toast.success(message);
    await refresh();
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateProgramInput) {
    if (!editTarget) return;
    const message = await programService.update(editTarget.id, {
      abbrev: input.abbrev,
      name: input.name,
      type: input.type,
      lengthYears: input.lengthYears,
    });
    if (message) toast.success(message);
    await refresh();
    setEditTarget(null);
  }

  async function handleDelete(target: Program) {
    const message = await programService.remove(target.id);
    if (message) toast.success(message);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Programs"
        description="Academic programs offered by each department."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Program
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative w-full sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="prog-search"
              type="search"
              placeholder="Code or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>
          <FilterDropdown
            id="prog-dept-filter"
            label="Department"
            allLabel="All departments"
            options={departments.map((d) => ({ value: d.abbrev, label: d.abbrev }))}
            value={deptFilter}
            onChange={setDeptFilter}
          />
          <FilterDropdown
            id="prog-type-filter"
            label="Type"
            allLabel="All types"
            options={PROGRAM_TYPES.map((t) => ({ value: t, label: t }))}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </div>

        {programsList === null ? (
          <div
            role="status"
            aria-label="Loading programs"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visiblePrograms.length === 0 ? (
          <EmptyState title="No programs found">
            No programs match the current filters. Adjust the search or add a new program.
          </EmptyState>
        ) : (
          <>
            <ProgramTable
              programs={pagination.pageItems}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
            <Pagination
              page={pagination.page}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
            />
          </>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Program">
        <ProgramForm
          departments={departments}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Program">
        {editTarget && (
          <ProgramForm
            program={editTarget}
            departments={departments}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete program"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget!)}
      >
        Program{" "}
        <span className="font-medium text-navy-700 dark:text-mist-100">{deleteTarget?.abbrev}</span>{" "}
        ({deleteTarget?.name}) will be removed from active lists. It can be restored from Recently Deleted.
      </ConfirmDialog>
    </div>
  );
}
