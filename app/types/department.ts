import type { BadgeTone } from "../components/ui/badge";

/** Badge color per department code — defaults to slate for unknown codes. */
export const DEPARTMENT_BADGE_TONES: Record<string, BadgeTone> = {
  CITE: "slate",
  CBA: "navy",
  COC: "sky",
  COEd: "gold",
};

export function getDeptTone(code: string): BadgeTone {
  return DEPARTMENT_BADGE_TONES[code] ?? "slate";
}

export type Department = {
  id: string;
  code: string;
  name: string;
  buildingId: string;
  buildingCode: string;
};

export type CreateDepartmentInput = Omit<Department, "id">;
export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;
