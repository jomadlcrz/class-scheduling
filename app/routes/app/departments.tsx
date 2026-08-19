import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { ResultState } from "~/components/feedback/result-state";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { CardGridSkeleton } from "~/components/ui/skeleton";
import { DepartmentForm } from "~/features/departments/department-form";
import { DepartmentArchiveDialog } from "~/features/departments/department-archive-dialog";
import { DepartmentGridView } from "~/features/departments/department-grid-view";
import { useCachedData } from "~/hooks/use-cached-data";
import { usePagination } from "~/hooks/use-pagination";
import { AcademicStructureTabs } from "~/layouts/academic-structure-tabs";
import { PageHeader } from "~/layouts/page-header";
import { buildingService } from "~/services/building.service";
import { departmentService } from "~/services/department.service";
import { enumService } from "~/services/enum.service";
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
  const { data: depts, error: loadError, reload } = useCachedData("departments", () =>
    departmentService.list(),
  );
  const { data: buildingsData } = useCachedData("buildings", () => buildingService.list());
  const buildings: Building[] = buildingsData ?? [];
  // Department type vocab comes from the backend enums endpoint.
  const { data: enumOptions } = useCachedData("enums", () => enumService.getOptions());
  const departmentTypes = enumOptions?.departmentType ?? [];
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Department | null>(null);

  const resetKey = `${search}|${buildingFilter}`;

  const visibleDepts = useMemo(() => {
    if (!depts) return [];
    const q = search.trim().toLowerCase();
    return depts
      .filter((d) => {
        if (buildingFilter !== "all" && d.buildingName !== buildingFilter) return false;
        if (q && !d.abbrev.toLowerCase().includes(q) && !d.name.toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort((a, b) => a.abbrev.localeCompare(b.abbrev));
  }, [depts, search, buildingFilter]);

  const pagination = usePagination(visibleDepts, resetKey);

  // Mutations return only a message, so the list is refetched afterwards.
  const refresh = reload;

  async function handleCreate(input: CreateDepartmentInput, logoFile?: File | null) {
    const message = await departmentService.create(input, logoFile);
    if (message) toast.success(message);
    await refresh();
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateDepartmentInput, logoFile?: File | null, logoRemoved?: boolean) {
    if (!editTarget) return;
    const message = await departmentService.update(editTarget.id, {
      abbrev: input.abbrev,
      name: input.name,
      buildingId: input.buildingId,
      departmentType: input.departmentType,
      description: input.description,
    });
    if (logoFile) {
      await departmentService.uploadLogo(editTarget.id, logoFile);
    } else if (logoRemoved && editTarget.logoUrl) {
      await departmentService.removeLogo(editTarget.id);
    }
    if (message) toast.success(message);
    await refresh();
    setEditTarget(null);
  }

  async function handleArchive(target: Department) {
    const message = await departmentService.remove(target.id, target.abbrev);
    if (message) toast.success(message);
    await refresh();
    setArchiveTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Departments"

        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Department
          </Button>
        }
      />

      <AcademicStructureTabs className="mt-4" />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative w-full sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="dept-search"
              type="search" placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
              className={`${inputClassName} pl-9 pr-4`}
            />
          </div>
          <FilterDropdown
            id="dept-building-filter"
            label="Building"
            allLabel="All buildings"
            options={buildings.map((b) => ({ value: b.name, label: b.name }))}
            value={buildingFilter}
            onChange={setBuildingFilter}
          />
        </div>

        {loadError && depts === null ? (
          <ResultState tone="error" title="Unable to load">
            {loadError}
          </ResultState>
        ) : depts === null ? (
          <CardGridSkeleton cards={6} />
        ) : visibleDepts.length === 0 ? (
          <EmptyState title={search.trim() || buildingFilter !== "all" ? "No departments found" : "No departments yet"}>
            {search.trim() || buildingFilter !== "all"
              ? "No departments match the current search and filters."
              : "Add a department to get started."}
          </EmptyState>
        ) : (
          <>
            <DepartmentGridView
              departments={pagination.pageItems}
              onEdit={setEditTarget}
              onArchive={setArchiveTarget}
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
          departmentTypes={departmentTypes}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Department">
        {editTarget && (
          <DepartmentForm
            department={editTarget}
            buildings={buildings}
            departmentTypes={departmentTypes}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <DepartmentArchiveDialog
        department={archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
      />
    </div>
  );
}
