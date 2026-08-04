import { ApiError, apiGet, apiMessage, apiPatch } from "~/lib/api";
import type { Room, RoomArchivePreview, RoomProgram } from "~/types/room";

/** Rooms read + archive against the facilities module (registrar_admin). */

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

function mapPrograms(programs: { program_id: number; program_abbrev: string; program_name: string }[]): RoomProgram[] {
  return programs.map((p) => ({
    programId: p.program_id,
    programAbbrev: p.program_abbrev,
    programName: p.program_name,
  }));
}

/** GET /get-facilities — rooms come nested per building; flattened here. 404 → empty. */
async function list(): Promise<Room[]> {
  let data: FacilitiesResponse;
  try {
    data = await apiGet<FacilitiesResponse>("/get-facilities");
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
      programs: mapPrograms(r.programs),
    })),
  );
}

/** PATCH /rooms/:id/archive — soft delete; the backend requires the room's own name
 * (case-sensitively) as confirmation. Returns the backend message. */
async function archive(id: number, confirmText: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/rooms/${id}/archive`, { confirm: confirmText });
  return apiMessage(data);
}

/** GET /rooms/:id/archive-preview — read-only: whether the room is archivable and what blocks it. */
async function getArchivePreview(id: number): Promise<RoomArchivePreview> {
  return apiGet<RoomArchivePreview>(`/rooms/${id}/archive-preview`);
}

type DeletedRoom = { id: number; name: string; deactivatedAt: string | null };

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

export const roomService = { list, archive, getArchivePreview, listDeleted, restore };
