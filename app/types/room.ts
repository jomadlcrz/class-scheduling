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
  "Non-Schedulable": "slate",
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

/** Full room row from GET /rooms/:id — used to populate edit forms. */
export type RoomDetail = {
  id: number;
  buildingId: number;
  floor: number;
  name: string;
  type: string;
  capacity: number;
  status: string;
  programIds: number[];
  programs: RoomProgram[];
};

/** Partial body for PUT /rooms/:id — only Vacant or Maintenance may be set manually. */
export type UpdateRoomInput = {
  roomName?: string;
  roomType?: string;
  roomCapacity?: number;
  floorLevel?: number;
  programIds?: number[];
  roomStatus?: "Vacant" | "Maintenance";
};

export const MANUAL_ROOM_STATUSES = ["Vacant", "Maintenance"] as const;

/** Shape of GET /rooms/:id/archive-preview and the PATCH /rooms/:id/archive payload.
 * A room still blocks while a real schedule uses it — the type-to-confirm on the
 * room's own name is the only other guard. */
export type RoomArchivePreview = {
  room: {
    roomId: number;
    roomName: string;
  };
  /** False when blockers.regularSchedules > 0. */
  archivable: boolean;
  blockers: {
    regularSchedules: number;
  };
};
