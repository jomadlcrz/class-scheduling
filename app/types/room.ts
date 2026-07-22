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
};

/** Status is backend-managed and buildings are referenced by name on create. */
export type CreateRoomInput = {
  buildingName: string;
  floor: number;
  name: string;
  capacity: number;
  type: string;
};

export type UpdateRoomInput = {
  floor?: number;
  name?: string;
  capacity?: number;
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
};
