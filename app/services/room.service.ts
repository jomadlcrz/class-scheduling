import { ApiError, apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
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
      time_remaining: string;
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
      timeRemaining: r.time_remaining,
    })),
  );
}

/** POST /rooms — bulk floors-per-building endpoint; a single create sends one floor with one room. Returns the backend message. */
async function create(input: CreateRoomInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/rooms", {
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
  return apiMessage(data);
}

/** PUT /rooms/:id — only floor, name, and capacity are updatable. Returns the backend message. */
async function update(id: number, input: UpdateRoomInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/rooms/${id}`, {
    ...(input.floor !== undefined && { floorLevel: input.floor }),
    ...(input.name !== undefined && { roomName: input.name }),
    ...(input.capacity !== undefined && { roomCapacity: input.capacity }),
  });
  return apiMessage(data);
}

/** DELETE /rooms/:id — returns the backend message. */
async function remove(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/rooms/${id}`);
  return apiMessage(data);
}

export const roomService = { list, create, update, remove };
