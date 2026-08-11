import { apiGet, apiMessage, apiPatch, apiPut } from "~/lib/api";
import type { RoomArchivePreview, RoomDetail, RoomProgram, UpdateRoomInput } from "~/types/room";

/** Rooms read + archive against the facilities module (registrar_admin). */

function mapPrograms(programs: { program_id: number; program_abbrev: string; program_name: string }[]): RoomProgram[] {
  return programs.map((p) => ({
    programId: p.program_id,
    programAbbrev: p.program_abbrev,
    programName: p.program_name,
  }));
}

/** GET /rooms/:id — one room detail. */
async function get(id: number): Promise<RoomDetail> {
  const data = await apiGet<RoomDetailResponse>(`/rooms/${id}`);
  return mapRoomDetail(data);
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

type RoomDetailResponse = {
  room_id: number;
  building_id: number;
  floor_level: number;
  room_name: string;
  room_type: string;
  room_capacity: number;
  room_status: string;
  program_ids: number[];
  programs: { program_id: number; program_abbrev: string; program_name: string }[];
};

function mapRoomDetail(raw: RoomDetailResponse): RoomDetail {
  return {
    id: raw.room_id,
    buildingId: raw.building_id,
    floor: raw.floor_level,
    name: raw.room_name,
    type: raw.room_type,
    capacity: raw.room_capacity,
    status: raw.room_status,
    programIds: raw.program_ids,
    programs: mapPrograms(raw.programs),
  };
}

/** PUT /rooms/:id — partial update; never send read-only statuses like Occupied. */
async function update(id: number, input: UpdateRoomInput): Promise<{ message: string; room: RoomDetail }> {
  const data = await apiPut<{ message?: string; room: RoomDetailResponse }>(`/rooms/${id}`, input);
  return { message: apiMessage(data), room: mapRoomDetail(data.room) };
}

export const roomService = { get, archive, getArchivePreview, update };
