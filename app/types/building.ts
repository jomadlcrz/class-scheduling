import type { BadgeTone } from "~/components/ui/badge";

const BUILDING_BADGE_TONES: Record<string, BadgeTone> = {
  "SHS Building": "navy",
  "Main Building": "gold",
};

export function getBuildingTone(name: string): BadgeTone {
  return BUILDING_BADGE_TONES[name] ?? "slate";
}

/** Backend building (app/modules/registrar_admin/facilities) — no code field exists there. */
export type Building = {
  id: number;
  name: string;
  floorCount: number;
};

export type CreateBuildingInput = {
  name: string;
  floorCount: number;
};

export type UpdateBuildingInput = {
  name?: string;
  floorCount?: number;
};

/** Shape of GET /buildings/:id/archive-preview and the PATCH /buildings/:id/archive payload.
 * Archiving cascades to active rooms, departments, and programs in the building. */
export type BuildingArchivePreview = {
  building: {
    buildingId: number;
    buildingName: string;
  };
  archivable: boolean;
  blockers: {
    roomsInUse: { roomId: number; roomName: string; regularSchedules: number }[];
    departmentsWithStaff: { departmentId: number; departmentName: string; staff: number }[];
  };
  willArchive: {
    rooms: { roomId: number; roomName: string }[];
    departments: { departmentId: number; departmentName: string }[];
    programs: { programId: number; programAbbrev: string }[];
  };
};

export type DeletedBuilding = {
  id: number;
  name: string;
  deactivatedAt: string | null;
  cascadeArchived?: {
    rooms: number;
    departments: number;
    programs: number;
  };
};
