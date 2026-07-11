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
