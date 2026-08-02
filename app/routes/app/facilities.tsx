import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/feedback/empty-state";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { PlusIcon, SearchIcon } from "~/components/ui/icons";
import { inputClassName } from "~/components/ui/input";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { TabList } from "~/components/ui/tabs";
import { BuildingArchiveDialog } from "~/features/facilities/buildings/building-archive-dialog";
import { BuildingTable } from "~/features/facilities/buildings/building-table";
import { RoomArchiveDialog } from "~/features/facilities/rooms/room-archive-dialog";
import { RoomTable } from "~/features/facilities/rooms/room-table";
import { usePagination } from "~/hooks/use-pagination";
import { PageHeader } from "~/layouts/page-header";
import { buildingService } from "~/services/building.service";
import { enumService } from "~/services/enum.service";
import { roomService } from "~/services/room.service";
import type { Building } from "~/types/building";
import type { Room } from "~/types/room";

type FacilitiesTab = "buildings" | "rooms";

export function meta() {
  return [
    { title: "Facilities — GWC Class Scheduling" },
    { name: "description", content: "Manage campus buildings and rooms." },
  ];
}

export default function Facilities() {
  return (
    <RoleGuard allow={["admin", "registrar"]}>
      <FacilitiesPage />
    </RoleGuard>
  );
}

function FacilitiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: FacilitiesTab = searchParams.get("tab") === "rooms" ? "rooms" : "buildings";

  const [buildings, setBuildings] = useState<Building[] | null>(null);
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<string[]>([]);
  const [buildingSearch, setBuildingSearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [archiveBuildingTarget, setArchiveBuildingTarget] = useState<Building | null>(null);
  const [archiveRoomTarget, setArchiveRoomTarget] = useState<Room | null>(null);

  useEffect(() => {
    buildingService.list().then(setBuildings).catch(() => setBuildings([]));
    roomService.list().then(setRooms).catch(() => setRooms([]));
    enumService
      .getOptions()
      .then((options) => {
        setRoomTypes(options.roomType);
        setRoomStatuses(options.classroomStatus);
      })
      .catch(() => {});
  }, []);

  const visibleBuildings = useMemo(() => {
    if (!buildings) return [];
    const q = buildingSearch.trim().toLowerCase();
    return buildings
      .filter((b) => !q || b.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [buildings, buildingSearch]);

  const roomResetKey = `${roomSearch}|${buildingFilter}|${typeFilter}|${statusFilter}`;

  const visibleRooms = useMemo(() => {
    if (!rooms) return [];
    const q = roomSearch.trim().toLowerCase();
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
  }, [rooms, roomSearch, buildingFilter, typeFilter, statusFilter]);

  const buildingPagination = usePagination(visibleBuildings, buildingSearch);
  const roomPagination = usePagination(visibleRooms, roomResetKey);

  function setTab(nextTab: FacilitiesTab) {
    setSearchParams(nextTab === "buildings" ? {} : { tab: nextTab }, { replace: true });
  }

  async function refreshBuildings() {
    setBuildings(await buildingService.list());
  }

  async function refreshRooms() {
    setRooms(await roomService.list());
  }

  async function refreshAll() {
    await Promise.all([refreshBuildings(), refreshRooms()]);
  }

  async function handleArchiveBuilding(target: Building) {
    const message = await buildingService.archive(target.id, target.name);
    if (message) toast.success(message);
    await refreshAll();
    setArchiveBuildingTarget(null);
  }

  async function handleArchiveRoom(target: Room) {
    const message = await roomService.archive(target.id, target.name);
    if (message) toast.success(message);
    await refreshRooms();
    setArchiveRoomTarget(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Facilities"
        description="Manage campus buildings and rooms. Create a building with its initial rooms in one step."
        actions={
          tab === "buildings" ? (
            <Button type="button" block={false} onClick={() => navigate("/facilities/new")}>
              <PlusIcon />
              New Building
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <TabList
          ariaLabel="Facilities views"
          tabs={[
            { value: "buildings", label: "Buildings" },
            { value: "rooms", label: "Rooms" },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === "buildings" ? (
          <>
            <div className="relative w-full sm:w-64">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <SearchIcon />
              </span>
              <input
                id="building-search"
                type="search"
                placeholder="Building name…"
                value={buildingSearch}
                onChange={(e) => setBuildingSearch(e.target.value)}
                aria-label="Search buildings"
                className={`${inputClassName} pl-9 pr-4`}
              />
            </div>

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
                No buildings match the current search. Adjust the search or create a new building.
              </EmptyState>
            ) : (
              <>
                <BuildingTable
                  buildings={buildingPagination.pageItems}
                  onArchive={setArchiveBuildingTarget}
                />
                <Pagination
                  page={buildingPagination.page}
                  totalItems={buildingPagination.totalItems}
                  pageSize={buildingPagination.pageSize}
                  onPageChange={buildingPagination.setPage}
                />
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="relative w-full sm:w-64">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <SearchIcon />
                </span>
                <input
                  id="room-search"
                  type="search"
                  placeholder="Room name…"
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  aria-label="Search rooms"
                  className={`${inputClassName} pl-9 pr-4`}
                />
              </div>
              <FilterDropdown
                id="room-building-filter"
                label="Building"
                allLabel="All buildings"
                options={(buildings ?? []).map((b) => ({ value: String(b.id), label: b.name }))}
                value={buildingFilter}
                onChange={setBuildingFilter}
              />
              <FilterDropdown
                id="room-type-filter"
                label="Type"
                allLabel="All types"
                options={roomTypes.map((t) => ({ value: t, label: t }))}
                value={typeFilter}
                onChange={setTypeFilter}
              />
              <FilterDropdown
                id="room-status-filter"
                label="Status"
                allLabel="All statuses"
                options={roomStatuses.map((s) => ({ value: s, label: s }))}
                value={statusFilter}
                onChange={setStatusFilter}
              />
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
                No rooms match the current filters. Adjust the search or create a building with rooms.
              </EmptyState>
            ) : (
              <>
                <RoomTable rooms={roomPagination.pageItems} onArchive={setArchiveRoomTarget} />
                <Pagination
                  page={roomPagination.page}
                  totalItems={roomPagination.totalItems}
                  pageSize={roomPagination.pageSize}
                  onPageChange={roomPagination.setPage}
                />
              </>
            )}
          </>
        )}
      </div>

      <BuildingArchiveDialog
        building={archiveBuildingTarget}
        onClose={() => setArchiveBuildingTarget(null)}
        onConfirm={handleArchiveBuilding}
      />

      <RoomArchiveDialog
        room={archiveRoomTarget}
        onClose={() => setArchiveRoomTarget(null)}
        onConfirm={handleArchiveRoom}
      />
    </div>
  );
}
