export const ROOM_TYPES = ["lecture", "laboratory", "office"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  lecture: "Lecture",
  laboratory: "Laboratory",
  office: "Office",
};

export const ROOM_STATUSES = ["vacant", "occupied", "maintenance"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  vacant: "Vacant",
  occupied: "Occupied",
  maintenance: "Maintenance",
};

export type Room = {
  id: string;
  buildingId: string;
  buildingCode: string;
  floor: number;
  name: string;
  capacity: number;
  type: RoomType;
  status: RoomStatus;
};

export type CreateRoomInput = Omit<Room, "id">;
export type UpdateRoomInput = Partial<CreateRoomInput>;
