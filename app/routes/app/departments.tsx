import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { ConfirmDialog, Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { DepartmentForm } from "~/features/departments/department-form";
import { DepartmentTable } from "~/features/departments/department-table";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { buildingService } from "~/services/building.service";
import { departmentService } from "~/services/department.service";
import type { Building } from "~/types/building";
import type { CreateDepartmentInput, Department } from "~/types/department";

export function meta() {
  return [
    { title: "Departments — GWC Class Scheduling" },
    { name: "description", content: "Manage academic departments." },
  ];
}

export default function Departments() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <DepartmentsPage />
    </RoleGuard>
  );
}

function DepartmentsPage() {
  const [depts, setDepts] = useState<Department[] | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  useEffect(() => {
    departmentService.list().then(setDepts).catch(() => setDepts([]));
    buildingService.list().then(setBuildings).catch(() => setBuildings([]));
  }, []);

  const resetKey = `${search}|${buildingFilter}`;

  const visibleDepts = useMemo(() => {
    if (!depts) return [];
    const q = search.trim().toLowerCase();
    return depts
      .filter((d) => {
        if (buildingFilter !== "all" && d.buildingName !== buildingFilter) return false;
        if (q && !d.code.toLowerCase().includes(q) && !d.name.toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [depts, search, buildingFilter]);

  const pagination = usePagination(visibleDepts, resetKey);

  // Mutations return only a message, so the list is refetched afterwards.
  async function refresh() {
    setDepts(await departmentService.list());
  }

  async function handleCreate(input: CreateDepartmentInput) {
    const message = await departmentService.create(input);
    if (message) toast.success(message);
    await refresh();
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateDepartmentInput) {
    if (!editTarget) return;
    const message = await departmentService.update(editTarget.id, { code: input.code, name: input.name });
    if (message) toast.success(message);
    await refresh();
    setEditTarget(null);
  }

  async function handleDelete(target: Department) {
    const message = await departmentService.remove(target.id);
    if (message) toast.success(message);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Departments"
        description="Academic departments and their assigned buildings."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Department
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
              id="dept-search"
              type="search"
              placeholder="Code or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>
          <div className="w-36 sm:w-44">
            <Select
              items={[
                { value: "all", label: "All buildings" },
                ...buildings.map((b) => ({ value: b.name, label: b.name })),
              ]}
              value={buildingFilter}
              onValueChange={(v) => setBuildingFilter(v as string)}
            >
              <SelectTrigger id="dept-building-filter" aria-label="Building">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All buildings</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.name}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {depts === null ? (
          <div
            role="status"
            aria-label="Loading departments"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleDepts.length === 0 ? (
          <EmptyState title="No departments found">
            No departments match the current filters. Adjust the search or add a new department.
          </EmptyState>
        ) : (
          <>
            <DepartmentTable
              departments={pagination.pageItems}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Department">
        <DepartmentForm
          buildings={buildings}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Department">
        {editTarget && (
          <DepartmentForm
            department={editTarget}
            buildings={buildings}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete department"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget!)}
      >
        Department{" "}
        <span className="font-medium text-navy-700 dark:text-white">{deleteTarget?.code}</span>{" "}
        ({deleteTarget?.name}) will be permanently removed.
      </ConfirmDialog>
    </div>
  );
}
