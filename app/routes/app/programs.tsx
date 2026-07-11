import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Select } from "~/components/ui/select";
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
        if (deptFilter !== "all" && p.departmentCode !== deptFilter) return false;
        if (typeFilter !== "all" && p.type !== typeFilter) return false;
        if (q && !p.code.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          a.departmentCode.localeCompare(b.departmentCode) || a.code.localeCompare(b.code),
      );
  }, [programsList, search, deptFilter, typeFilter]);

  const pagination = usePagination(visiblePrograms, resetKey);

  // Mutations return only a message, so the list is refetched afterwards.
  async function refresh() {
    setProgramsList(await programService.list());
  }

  async function handleCreate(input: CreateProgramInput) {
    await programService.create(input);
    await refresh();
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateProgramInput) {
    if (!editTarget) return;
    await programService.update(editTarget.id, {
      code: input.code,
      name: input.name,
      type: input.type,
      lengthYears: input.lengthYears,
    });
    await refresh();
    setEditTarget(null);
  }

  async function handleDelete(target: Program) {
    await programService.remove(target.id);
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <Input
              id="prog-search"
              label="Search"
              type="search"
              placeholder="Code or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            id="prog-dept-filter"
            label="Department"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.code}>
                {d.code}
              </option>
            ))}
          </Select>
          <Select
            id="prog-type-filter"
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            {PROGRAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
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
        <span className="font-medium text-navy-700 dark:text-white">{deleteTarget?.code}</span>{" "}
        ({deleteTarget?.name}) will be permanently removed.
      </ConfirmDialog>
    </div>
  );
}
