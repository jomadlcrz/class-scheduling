/** Payload for POST /create-facilities — one building and all nested rooms in one transaction. */
export type CreateFacilityRoomInput = {
  roomName: string;
  roomType: string;
  roomCapacity: number;
  programIds?: number[];
};

export type CreateFacilityFloorInput = {
  floorLevel: number;
  rooms: CreateFacilityRoomInput[];
};

export type CreateFacilitiesInput = {
  buildingName: string;
  floorCount: number;
  floors: CreateFacilityFloorInput[];
};

/** A room row while composing a new facility in the UI. */
export type FacilityRoomDraft = {
  key: string;
  roomName: string;
  roomType: string;
  roomCapacity: number;
  programIds: number[];
};

/** Floor bucket used by the create-building workspace. */
export type FacilityFloorDraft = {
  floorLevel: number;
  rooms: FacilityRoomDraft[];
};
