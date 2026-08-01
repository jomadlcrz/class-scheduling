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

export type CreateBuildingInput = Omit<Building, "id">;
export type UpdateBuildingInput = Partial<CreateBuildingInput>;

/** Shape of GET /buildings/:id/delete-preview and the DELETE /buildings/:id payload.
 * Cascades through every department's programs and soft-deletes its rooms and
 * departments — but refuses outright if a room is in active use or a department
 * has staff assigned. */
export type BuildingDeletePreview = {
  building: {
    building_id: number;
    building_name: string;
  };
  /** False when either blockers list is non-empty. */
  deletable: boolean;
  blockers: {
    rooms_in_use: { room_id: number; room_name: string; regular_schedules: number }[];
    departments_with_staff: { department_id: number; department_name: string; staff: number }[];
  };
  will_delete: {
    rooms: { room_id: number; room_name: string }[];
    departments: { department_id: number; department_name: string }[];
    programs: { program_id: number; program_abbrev: string }[];
  };
};
