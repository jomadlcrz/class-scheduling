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
import { RoomForm } from "~/features/facilities/rooms/room-form";
import { RoomTable } from "~/features/facilities/rooms/room-table";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { buildingService } from "~/services/building.service";
import { enumService } from "~/services/enum.service";
import { roomService } from "~/services/room.service";
import type { Building } from "~/types/building";
import type { CreateRoomInput, Room } from "~/types/room";

export function meta() {
  return [
    { title: "Rooms — GWC Class Scheduling" },
    { name: "description", content: "Manage campus rooms and their availability." },
  ];
}

export default function Rooms() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <RoomsPage />
    </RoleGuard>
  );
}

function RoomsPage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  useEffect(() => {
    roomService.list().then(setRooms).catch(() => setRooms([]));
    buildingService.list().then(setBuildings).catch(() => setBuildings([]));
    // Room type / status vocab comes from the backend enums endpoint.
    enumService
      .getOptions()
      .then((options) => {
        setRoomTypes(options.roomType);
        setRoomStatuses(options.classroomStatus);
      })
      .catch(() => {});
  }, []);

  const resetKey = `${search}|${buildingFilter}|${typeFilter}|${statusFilter}`;

  const visibleRooms = useMemo(() => {
    if (!rooms) return [];
    const q = search.trim().toLowerCase();
    return rooms
      .filter((r) => {
        if (buildingFilter !== "all" && String(r.buildingId) !== buildingFilter) return false;
        if (typeFilter !== "all" && r.type !== typeFilter) return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (q && !r.name.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort(
        (a, b) =>
          a.buildingName.localeCompare(b.buildingName) ||
          a.floor - b.floor ||
          a.name.localeCompare(b.name),
      );
  }, [rooms, search, buildingFilter, typeFilter, statusFilter]);

  const pagination = usePagination(visibleRooms, resetKey);

  // Mutations return only a message, so the list is refetched afterwards.
  async function refresh() {
    setRooms(await roomService.list());
  }

  async function handleCreate(input: CreateRoomInput) {
    await roomService.create(input);
    await refresh();
    setCreateOpen(false);
  }

  async function handleEdit(input: CreateRoomInput) {
    if (!editTarget) return;
    await roomService.update(editTarget.id, {
      floor: input.floor,
      name: input.name,
      capacity: input.capacity,
    });
    await refresh();
    setEditTarget(null);
  }

  async function handleDelete(target: Room) {
    await roomService.remove(target.id);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Rooms"
        description="Campus rooms and their current status."
        actions={
          <Button type="button" block={false} onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Room
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              id="room-search"
              label="Search"
              type="search"
              placeholder="Room name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            id="room-building-filter"
            label="Building"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="all">All buildings</option>
            {buildings.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select
            id="room-type-filter"
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            {roomTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            id="room-status-filter"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {roomStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        {rooms === null ? (
          <div
            role="status"
            aria-label="Loading rooms"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleRooms.length === 0 ? (
          <EmptyState title="No rooms found">
            No rooms match the current filters. Adjust the search or add a new room.
          </EmptyState>
        ) : (
          <>
            <RoomTable
              rooms={pagination.pageItems}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Room">
        <RoomForm
          buildings={buildings}
          roomTypes={roomTypes}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title="Edit Room">
        {editTarget && (
          <RoomForm
            room={editTarget}
            buildings={buildings}
            roomTypes={roomTypes}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete room"
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget!)}
      >
        Room{" "}
        <span className="font-medium text-navy-700 dark:text-white">{deleteTarget?.name}</span>{" "}
        will be permanently removed.
      </ConfirmDialog>
    </div>
  );
}
