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
    Promise.all([departmentService.list(), buildingService.list()]).then(([d, b]) => {
      setDepts(d);
      setBuildings(b);
    });
  }, []);

  const resetKey = `${search}|${buildingFilter}`;

  const visibleDepts = useMemo(() => {
    if (!depts) return [];
    const q = search.trim().toLowerCase();
    return depts
      .filter((d) => {
        if (buildingFilter !== "all" && d.buildingId !== buildingFilter) return false;
        if (q && !d.code.toLowerCase().includes(q) && !d.name.toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [depts, search, buildingFilter]);

  const pagination = usePagination(visibleDepts, resetKey);

  async function handleCreate(input: CreateDepartmentInput) {
    const created = await departmentService.create(input);
    setDepts((curr) => [...(curr ?? []), created]);
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateDepartmentInput) {
    if (!editTarget) return;
    const updated = await departmentService.update(editTarget.id, input);
    setDepts((curr) => curr!.map((d) => (d.id === updated.id ? updated : d)));
    setEditTarget(null);
  }

  async function handleDelete(target: Department) {
    await departmentService.remove(target.id);
    setDepts((curr) => curr!.filter((d) => d.id !== target.id));
  }

  return (
    <>
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <Input
              id="dept-search"
              label="Search"
              type="search"
              placeholder="Code or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            id="dept-building-filter"
            label="Building"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="all">All buildings</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} — {b.name}
              </option>
            ))}
          </Select>
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
              onEdit={(d) => setEditTarget(d)}
              onDelete={(d) => setDeleteTarget(d)}
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
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
    </>
  );
}
