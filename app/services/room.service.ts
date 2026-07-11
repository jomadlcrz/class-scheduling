import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "~/lib/api";
import type { CreateRoomInput, Room, UpdateRoomInput } from "~/types/room";

/** Rooms CRUD against the facilities module (registrar_admin). */

type RoomsResponse = {
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
    }[];
  }[];
};

/** GET /rooms — rooms come nested per building; flattened here. 404 → empty. */
async function list(): Promise<Room[]> {
  let data: RoomsResponse;
  try {
    data = await apiGet<RoomsResponse>("/rooms");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.buildings.flatMap((b) =>
    b.rooms.map((r) => ({
      id: r.room_id,
      buildingId: b.building_id,
      buildingName: b.building_name,
      floor: r.floor_level,
      name: r.room_name,
      capacity: r.room_capacity,
      type: r.room_type,
      status: r.room_status,
    })),
  );
}

/** POST /rooms — bulk floors-per-building endpoint; a single create sends one floor with one room. */
async function create(input: CreateRoomInput): Promise<void> {
  await apiPost("/rooms", {
    buildingName: input.buildingName,
    floors: [
      {
        floorLevel: input.floor,
        rooms: [
          {
            roomName: input.name,
            roomType: input.type,
            roomCapacity: input.capacity,
          },
        ],
      },
    ],
  });
}

/** PUT /rooms/:id — only floor, name, and capacity are updatable. */
async function update(id: number, input: UpdateRoomInput): Promise<void> {
  await apiPut(`/rooms/${id}`, {
    ...(input.floor !== undefined && { floorLevel: input.floor }),
    ...(input.name !== undefined && { roomName: input.name }),
    ...(input.capacity !== undefined && { roomCapacity: input.capacity }),
  });
}

/** DELETE /rooms/:id */
async function remove(id: number): Promise<void> {
  await apiDelete(`/rooms/${id}`);
}

export const roomService = { list, create, update, remove };
