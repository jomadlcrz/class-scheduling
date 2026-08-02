import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "~/components/feedback/empty-state";
import { Card } from "~/components/ui/card";
import { FilterDropdown } from "~/components/ui/dropdown-menu";
import {
  BuildingSummaryPanel,
} from "~/features/facilities/building-summary-panel";
import { FacilityRoomViewCard } from "~/features/facilities/facility-room-view-card";
import {
  buildFloorBuckets,
  computeBuildingSummary,
  floorButtonClassName,
  statCardClassName,
} from "~/features/facilities/facility-view-utils";
import type { FacilityBuildingDetail } from "~/types/facility";
import type { Program } from "~/types/program";

type BuildingViewWorkspaceProps = {
  buildings: FacilityBuildingDetail[];
  programs: Program[];
  selectedBuildingId: number | null;
  onBuildingChange: (buildingId: number) => void;
};

export function BuildingViewWorkspace({
  buildings,
  programs,
  selectedBuildingId,
  onBuildingChange,
}: BuildingViewWorkspaceProps) {
  const building =
    buildings.find((entry) => entry.id === selectedBuildingId) ?? buildings[0] ?? null;
  const [selectedFloor, setSelectedFloor] = useState(1);

  useEffect(() => {
    if (building) setSelectedFloor(1);
  }, [building?.id]);

  const floors = useMemo(() => (building ? buildFloorBuckets(building) : []), [building]);
  const summary = useMemo(
    () => (building ? computeBuildingSummary(building) : null),
    [building],
  );
  const visibleRooms = floors.find((floor) => floor.floorLevel === selectedFloor)?.rooms ?? [];

  if (buildings.length === 0) {
    return (
      <EmptyState title="No buildings found">
        Create a building to start managing campus facilities.
      </EmptyState>
    );
  }

  if (!building || !summary) return null;

  return (
    <div className="flex flex-col gap-6">
      <FilterDropdown
        id="facilities-building-select"
        label="Building"
        allLabel="Select building"
        options={buildings.map((entry) => ({ value: String(entry.id), label: entry.name }))}
        value={String(building.id)}
        onChange={(value) => onBuildingChange(Number(value))}
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Building Name
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">{building.name}</p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total Floors
            </p>
            <p className="mt-1 font-medium text-navy-700 dark:text-mist-100">{building.floorCount}</p>
          </div>
          <div className={statCardClassName}>
            <p className="font-body text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total Rooms
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
              Floor {selectedFloor}
            </h2>
            <p className="font-body text-sm text-slate-500 dark:text-slate-400">
              {visibleRooms.length} room{visibleRooms.length === 1 ? "" : "s"}
            </p>
          </div>

          {visibleRooms.length === 0 ? (
            <Card className="p-8">
              <EmptyState title={`No rooms on Floor ${selectedFloor}`}>
                This floor has no rooms assigned yet.
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
