import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type { CreateRoomInput, Room, RoomDetail, UpdateRoomInput } from "~/types/room";

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

export type DeletedRoom = { id: number; name: string; deactivatedAt: string | null };

type RoomRecycleBinResponse = { room_id: number; room_name: string; deactivated_at: string | null }[];

/** GET /rooms/recycle-bin — 404 → empty. */
async function listDeleted(): Promise<DeletedRoom[]> {
  let data: RoomRecycleBinResponse;
  try {
    data = await apiGet<RoomRecycleBinResponse>("/rooms/recycle-bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((r) => ({ id: r.room_id, name: r.room_name, deactivatedAt: r.deactivated_at }));
}

/** PATCH /rooms/:id/restore */
async function restore(id: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/rooms/${id}/restore`);
  return apiMessage(data);
}

/** GET /rooms/:id */
async function get(id: number): Promise<RoomDetail> {
  const r = await apiGet<{
    room_id: number;
    building_id: number;
    floor_level: number;
    room_name: string;
    room_type: string;
    room_capacity: number;
    room_status: string;
  }>(`/rooms/${id}`);
  return {
    id: r.room_id,
    buildingId: r.building_id,
    floor: r.floor_level,
    name: r.room_name,
    type: r.room_type,
    capacity: r.room_capacity,
    status: r.room_status,
  };
}

export const roomService = { list, create, update, remove, listDeleted, restore, get };
