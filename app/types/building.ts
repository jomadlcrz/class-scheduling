import type { BadgeTone } from "../components/ui/badge";

const BUILDING_BADGE_TONES: Record<string, BadgeTone> = {
  SHS: "navy",
  MB: "gold",
};

export function getBuildingTone(code: string): BadgeTone {
  return BUILDING_BADGE_TONES[code] ?? "slate";
}

export type Building = {
  id: string;
  name: string;
  code: string;
  floorCount: number;
};

export type CreateBuildingInput = Omit<Building, "id">;
export type UpdateBuildingInput = Partial<CreateBuildingInput>;
