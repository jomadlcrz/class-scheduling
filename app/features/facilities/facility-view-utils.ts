import type { BuildingSummaryData } from "~/features/facilities/building-summary-panel";
import type { FacilityBuildingDetail } from "~/types/facility";

export function computeBuildingSummary(building: FacilityBuildingDetail): BuildingSummaryData {
  return computeFilteredSummary(building, building.rooms);
}

export function computeFilteredSummary(
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

export function buildFloorBuckets(building: FacilityBuildingDetail) {
  const floors = Array.from({ length: building.floorCount }, (_, index) => ({
    floorLevel: index + 1,
    rooms: [] as FacilityBuildingDetail["rooms"],
  }));

  for (const room of building.rooms) {
    const floor = floors[room.floor - 1];
    if (floor) floor.rooms.push(room);
  }

  for (const floor of floors) {
    floor.rooms.sort((a, b) => a.name.localeCompare(b.name));
  }

  return floors;
}

const floorButtonClassName = (active: boolean) =>
  `flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
    active
      ? "border-gwc-blue-bright bg-gwc-blue-bright/10 font-semibold text-gwc-blue-bright dark:border-blue-400 dark:bg-blue-400/10 dark:text-blue-300"
      : "border-slate-200 bg-white text-navy-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-mist-100 dark:hover:bg-white/10"
  }`;

export const statCardClassName =
  "rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5";

export { floorButtonClassName };
