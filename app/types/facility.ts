import type { RoomProgram } from "~/types/room";

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

/** Payload for POST /buildings/:id/rooms — add rooms to an existing building. */
export type AddBuildingRoomsInput = {
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

/** Nested building payload from GET /get-facilities. */
export type FacilityBuildingDetail = {
  id: number;
  name: string;
  floorCount: number;
  rooms: FacilityRoomDetail[];
};

export type FacilityRoomDetail = {
  id: number;
  floor: number;
  name: string;
  type: string;
  capacity: number;
  status: string;
  timeRemaining: string;
  programIds: number[];
  programs: RoomProgram[];
};

/** Room row while editing an existing building. */
export type EditFacilityRoomDraft = {
  key: string;
  roomId?: number;
  roomName: string;
  roomType: string;
  roomCapacity: number;
  programIds: number[];
  status: string;
  isNew: boolean;
  isDeleted: boolean;
};

export type EditFacilityFloorDraft = {
  floorLevel: number;
  rooms: EditFacilityRoomDraft[];
};

export type EditBuildingChangeSummary = {
  added: number;
  modified: number;
  deleted: number;
};
