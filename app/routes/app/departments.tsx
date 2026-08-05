import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { DepartmentForm } from "~/features/departments/department-form";
import { DepartmentArchiveDialog } from "~/features/departments/department-archive-dialog";
import { DepartmentGridView } from "~/features/departments/department-grid-view";
import { DepartmentTable } from "~/features/departments/department-table";
import { ScheduleViewToggle, type ScheduleViewMode } from "~/features/schedules/schedule-view-toggle";
import { usePagination } from "~/hooks/use-pagination";
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
  const [depts, setDepts] = useState<Department[] | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [departmentTypes, setDepartmentTypes] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("table");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Department | null>(null);

  useEffect(() => {
    departmentService.list().then(setDepts).catch(() => setDepts([]));
    buildingService.list().then(setBuildings).catch(() => setBuildings([]));
    // Department type vocab comes from the backend enums endpoint.
    enumService
      .getOptions()
      .then((options) => setDepartmentTypes(options.departmentType))
      .catch(() => {});
  }, []);

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
  const reduceMotion = useReducedMotion();

  // Mutations return only a message, so the list is refetched afterwards.
  async function refresh() {
    setDepts(await departmentService.list());
  }

  async function handleCreate(input: CreateDepartmentInput, logoFile?: File | null) {
    const message = await departmentService.create(input, logoFile);
    if (message) toast.success(message);
    await refresh();
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateDepartmentInput) {
    if (!editTarget) return;
    const message = await departmentService.update(editTarget.id, {
      abbrev: input.abbrev,
      name: input.name,
      buildingId: input.buildingId,
      departmentType: input.departmentType,
    });
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
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
            <div className="flex w-full items-end justify-between gap-3 sm:w-auto sm:justify-start">
              <FilterDropdown
                id="dept-building-filter"
                label="Building"
                allLabel="All buildings"
                options={buildings.map((b) => ({ value: b.name, label: b.name }))}
                value={buildingFilter}
                onChange={setBuildingFilter}
              />
              <div className="sm:hidden">
                <ScheduleViewToggle value={viewMode} onChange={setViewMode} ariaLabel="Department view" />
              </div>
            </div>
          </div>
          <div className="hidden sm:block">
            <ScheduleViewToggle value={viewMode} onChange={setViewMode} ariaLabel="Department view" />
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
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={viewMode}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
              >
                {viewMode === "grid" ? (
                  <DepartmentGridView
                    departments={pagination.pageItems}
                    onEdit={setEditTarget}
                    onArchive={setArchiveTarget}
                  />
                ) : (
                  <DepartmentTable
                    departments={pagination.pageItems}
                    onEdit={setEditTarget}
                    onArchive={setArchiveTarget}
                  />
                )}
              </motion.div>
            </AnimatePresence>
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
            onLogoChanged={refresh}
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
