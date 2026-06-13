import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "../../auth/role-guard";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { PlusIcon } from "../../components/ui/icons";
import { Input } from "../../components/ui/input";
import { ConfirmDialog, Modal } from "../../components/ui/modal";
import { Pagination } from "../../components/ui/pagination";
import { Spinner } from "../../components/ui/spinner";
import { BuildingForm } from "../../features/facilities/buildings/building-form";
import { BuildingTable } from "../../features/facilities/buildings/building-table";
import { usePagination } from "../../hooks/use-pagination";
import { PageHeader } from "../../layouts/page-header";
import { buildingService } from "../../services/building.service";
import type { Building, CreateBuildingInput } from "../../types/building";

export function meta() {
  return [
    { title: "Buildings — GWC Class Scheduling" },
    { name: "description", content: "Manage campus buildings." },
  ];
}

export default function Buildings() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <BuildingsPage />
    </RoleGuard>
  );
}

function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[] | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Building | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);

  useEffect(() => {
    buildingService.list().then(setBuildings);
  }, []);

  const visibleBuildings = useMemo(() => {
    if (!buildings) return [];
    const q = search.trim().toLowerCase();
    return buildings
      .filter((b) => !q || b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [buildings, search]);

  const pagination = usePagination(visibleBuildings, search);

  async function handleCreate(input: CreateBuildingInput) {
    const created = await buildingService.create(input);
    setBuildings((curr) => [...(curr ?? []), created]);
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateBuildingInput) {
    if (!editTarget) return;
    const updated = await buildingService.update(editTarget.id, input);
    setBuildings((curr) => curr!.map((b) => (b.id === updated.id ? updated : b)));
    setEditTarget(null);
  }

  async function handleDelete(target: Building) {
    await buildingService.remove(target.id);
    setBuildings((curr) => curr!.filter((b) => b.id !== target.id));
  }

  return (
    <>
      <PageHeader
        title="Buildings"
        description="Campus buildings and their floor information."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Building
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <Input
          id="building-search"
          label="Search"
          type="search"
          placeholder="Name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {buildings === null ? (
          <div
            role="status"
            aria-label="Loading buildings"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleBuildings.length === 0 ? (
          <EmptyState title="No buildings found">
            No buildings match the current search. Adjust your query or add a new building.
          </EmptyState>
        ) : (
          <>
            <BuildingTable
              buildings={pagination.pageItems}
              onEdit={(b) => setEditTarget(b)}
              onDelete={(b) => setDeleteTarget(b)}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Building">
        <BuildingForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Building">
        {editTarget && (
          <BuildingForm
            building={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete building"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget!)}
      >
        Building{" "}
        <span className="font-medium text-navy-700 dark:text-white">{deleteTarget?.name}</span>{" "}
        ({deleteTarget?.code}) will be permanently removed.
      </ConfirmDialog>
    </>
  );
}
