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

/** Shape of GET /buildings/:id/archive-preview and the PATCH /buildings/:id/archive payload.
 * Archiving cascades to active rooms in the building, but refuses if any room is still
 * used by a schedule. */
export type BuildingArchivePreview = {
  building: {
    buildingId: number;
    buildingName: string;
  };
  /** False when blockers.roomsInUse is non-empty. */
  archivable: boolean;
  blockers: {
    roomsInUse: { roomId: number; roomName: string; regularSchedules: number }[];
  };
  willArchive: { roomId: number; roomName: string }[];
};
