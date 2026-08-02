import { ApiError, apiGet, apiMessage, apiPost } from "~/lib/api";
import type {
  CreateFacilitiesInput,
  FacilityBuildingDetail,
  FacilityRoomDetail,
} from "~/types/facility";
import type { RoomProgram } from "~/types/room";

type FacilitiesResponse = {
  buildings: {
    building_id: number;
    building_name: string;
    floor_count: number;
    rooms: {
      room_id: number;
      floor_level: number;
      room_name: string;
      room_type: string;
      room_capacity: number;
      room_status: string;
      time_remaining: string;
      programs: { program_id: number; program_abbrev: string; program_name: string }[];
    }[];
  }[];
};

function mapPrograms(
  programs: { program_id: number; program_abbrev: string; program_name: string }[],
): RoomProgram[] {
  return programs.map((p) => ({
    programId: p.program_id,
    programAbbrev: p.program_abbrev,
    programName: p.program_name,
  }));
}

function mapRoom(room: FacilitiesResponse["buildings"][number]["rooms"][number]): FacilityRoomDetail {
  return {
    id: room.room_id,
    floor: room.floor_level,
    name: room.room_name,
    type: room.room_type,
    capacity: room.room_capacity,
    status: room.room_status,
    timeRemaining: room.time_remaining,
    programIds: room.programs.map((p) => p.program_id),
  };
}

function mapBuilding(building: FacilitiesResponse["buildings"][number]): FacilityBuildingDetail {
  return {
    id: building.building_id,
    name: building.building_name,
    floorCount: building.floor_count,
    rooms: building.rooms.map(mapRoom),
  };
}

/** GET /get-facilities — nested buildings with rooms. 404 → empty. */
async function list(): Promise<FacilityBuildingDetail[]> {
  let data: FacilitiesResponse;
  try {
    data = await apiGet<FacilitiesResponse>("/get-facilities");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.buildings.map(mapBuilding);
}

/** GET /get-facilities — one building by id. */
async function getById(buildingId: number): Promise<FacilityBuildingDetail | null> {
  const buildings = await list();
  return buildings.find((building) => building.id === buildingId) ?? null;
}

/** POST /create-facilities — atomically creates one building and all nested rooms. */
async function create(input: CreateFacilitiesInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/create-facilities", input);
  return apiMessage(data);
}

export const facilityService = { list, getById, create };
