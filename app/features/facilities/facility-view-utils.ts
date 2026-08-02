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
