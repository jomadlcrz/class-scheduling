import type { BadgeTone } from "~/components/ui/badge";

/**
 * Room type and status vocabularies live in the backend (app/enums.py) and are
 * fetched via enumService — only display tones are mapped here, by value.
 */
export const ROOM_STATUS_TONES: Record<string, BadgeTone> = {
  Vacant: "emerald",
  Occupied: "red",
  Maintenance: "gold",
  Archived: "slate",
};

/** A program allowed into a room. Empty list on a room means general-purpose —
 * open to every program in the room's own building. */
export type RoomProgram = {
  programId: number;
  programAbbrev: string;
  programName: string;
};

export type Room = {
  id: number;
  buildingId: number;
  buildingName: string;
  floor: number;
  name: string;
  capacity: number;
  /** Backend RoomType value, e.g. "Lecture Room". */
  type: string;
  /** Backend ClassroomStatus value, e.g. "Vacant" — managed by the scheduler. */
  status: string;
  /** Backend-composed countdown string, e.g. "Time Remaining Before: Occupied is 2:30:00". */
  timeRemaining: string;
  programs: RoomProgram[];
};

/** Status is backend-managed and buildings are referenced by name on create.
 * programIds is optional; a Laboratory room is rejected by the backend if empty. */
export type CreateRoomInput = {
  buildingName: string;
  floor: number;
  name: string;
  capacity: number;
  type: string;
  programIds?: number[];
};

export type UpdateRoomInput = {
  buildingName?: string;
  floor?: number;
  name?: string;
  capacity?: number;
  /** Backend RoomType value, e.g. "Lecture Room". */
  type?: string;
  /** Omit to leave access untouched; an empty array hands the room back to its whole building. */
  programIds?: number[];
};

/** GET /rooms/:id response — a leaner shape than the nested-list `Room` (no buildingName/timeRemaining join). */
export type RoomDetail = {
  id: number;
  buildingId: number;
  floor: number;
  name: string;
  type: string;
  capacity: number;
  status: string;
  programs: RoomProgram[];
};

/** Shape of GET /rooms/:id/delete-preview and the DELETE /rooms/:id payload.
 * Unlike Program/Set/Subject, a room delete STILL blocks: deleting a room doesn't
 * remove the curriculum requirement, so a schedule that depends on it can't be
 * cascaded away. The type-to-confirm is the only other guard. */
export type RoomDeletePreview = {
  room: {
    room_id: number;
    room_name: string;
  };
  /** False when a real schedule still uses this room (blockers.regular_schedules > 0). */
  deletable: boolean;
  blockers: {
    regular_schedules: number;
  };
};
