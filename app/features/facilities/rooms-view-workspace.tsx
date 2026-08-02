import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "~/components/feedback/empty-state";
import { Card } from "~/components/ui/card";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import { inputClassName } from "~/components/ui/input";
import { SearchIcon } from "~/components/ui/icons";
import {
  BuildingSummaryPanel,
  type BuildingSummaryData,
} from "~/features/facilities/building-summary-panel";
import { FacilityRoomViewCard } from "~/features/facilities/facility-room-view-card";
import {
  buildFloorBuckets,
  floorButtonClassName,
  statCardClassName,
} from "~/features/facilities/facility-view-utils";
import type { FacilityBuildingDetail } from "~/types/facility";
import type { Program } from "~/types/program";

type RoomsViewWorkspaceProps = {
  buildings: FacilityBuildingDetail[];
  programs: Program[];
  roomTypes: string[];
  roomStatuses: string[];
  selectedBuildingId: number | null;
  onBuildingChange: (buildingId: number) => void;
};

function computeFilteredSummary(
  building: FacilityBuildingDetail,
  rooms: FacilityBuildingDetail["rooms"],
): BuildingSummaryData {
  const roomTypeCounts: Record<string, number> = {};
  const labProgramIds = new Set<number>();

  for (const room of rooms) {
    roomTypeCounts[room.type] = (roomTypeCounts[room.type] ?? 0) + 1;
    if (room.type === "Laboratory") {
      room.programIds.forEach((id) => labProgramIds.add(id));
    }
  }

  return {
    buildingName: building.name,
    floorCount: building.floorCount,
    totalRooms: rooms.length,
    roomTypeCounts,
    labProgramIds: [...labProgramIds],
  };
}

export function RoomsViewWorkspace({
  buildings,
  programs,
  roomTypes,
  roomStatuses,
  selectedBuildingId,
  onBuildingChange,
}: RoomsViewWorkspaceProps) {
  const building =
    buildings.find((entry) => entry.id === selectedBuildingId) ?? buildings[0] ?? null;

  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setSelectedFloor("all");
  }, [building?.id]);

  const filteredRooms = useMemo(() => {
    if (!building) return [];
    const q = search.trim().toLowerCase();
    return building.rooms.filter((room) => {
      if (selectedFloor !== "all" && room.floor !== selectedFloor) return false;
      if (typeFilter !== "all" && room.type !== typeFilter) return false;
      if (statusFilter !== "all" && room.status !== statusFilter) return false;
      if (q && !room.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [building, selectedFloor, search, typeFilter, statusFilter]);

  const floors = useMemo(() => (building ? buildFloorBuckets(building) : []), [building]);
  const summary = useMemo(
    () => (building ? computeFilteredSummary(building, filteredRooms) : null),
    [building, filteredRooms],
  );

  const visibleRooms = useMemo(
    () => [...filteredRooms].sort((a, b) => a.floor - b.floor || a.name.localeCompare(b.name)),
    [filteredRooms],
  );

  if (buildings.length === 0) {
    return (
      <EmptyState title="No rooms found">
        Rooms appear here once buildings have been created.
      </EmptyState>
    );
  }

  if (!building || !summary) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <FilterDropdown
          id="rooms-building-select"
          label="Building"
          allLabel="Select building"
          options={buildings.map((entry) => ({ value: String(entry.id), label: entry.name }))}
          value={String(building.id)}
          onChange={(value) => onBuildingChange(Number(value))}
        />
        <div className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            id="rooms-view-search"
            type="search"
            placeholder="Room name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search rooms"
            className={`${inputClassName} pl-9 pr-4`}
          />
        </div>
        <FilterDropdown
          id="rooms-view-type-filter"
          label="Type"
          allLabel="All types"
          options={roomTypes.map((type) => ({ value: type, label: type }))}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <FilterDropdown
          id="rooms-view-status-filter"
          label="Status"
          allLabel="All statuses"
          options={roomStatuses.map((status) => ({ value: status, label: status }))}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Building
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">{building.name}</p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Matching Rooms
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">{summary.totalRooms}</p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Lecture Rooms
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">
              {summary.roomTypeCounts["Lecture Room"] ?? 0}
            </p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Laboratory Rooms
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">
              {summary.roomTypeCounts.Laboratory ?? 0}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <Card className="h-fit p-4">
          <h2 className="font-display text-base tracking-wide text-navy-700 dark:text-mist-100">Floors</h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <button
                type="button"
                className={floorButtonClassName(selectedFloor === "all")}
                onClick={() => setSelectedFloor("all")}
              >
                <span>All Floors</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{building.rooms.length} rooms</span>
              </button>
            </li>
            {floors.map((floor) => (
              <li key={floor.floorLevel}>
                <button
                  type="button"
                  className={floorButtonClassName(selectedFloor === floor.floorLevel)}
                  onClick={() => setSelectedFloor(floor.floorLevel)}
                >
                  <span>Floor {floor.floorLevel}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {floor.rooms.length} rooms
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-display text-lg tracking-wide text-navy-700 dark:text-mist-100">
              {selectedFloor === "all" ? "All Rooms" : `Floor ${selectedFloor}`}
            </h2>
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">
              {visibleRooms.length} room{visibleRooms.length === 1 ? "" : "s"}
            </p>
          </div>

          {visibleRooms.length === 0 ? (
            <Card className="p-8">
              <EmptyState title="No rooms found">
                No rooms match the current filters. Adjust the search or filters.
              </EmptyState>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {visibleRooms.map((room) => (
                <FacilityRoomViewCard key={room.id} room={room} programs={programs} />
              ))}
            </div>
          )}
        </div>

        <BuildingSummaryPanel summary={summary} programs={programs} />
      </div>
    </div>
  );
}
