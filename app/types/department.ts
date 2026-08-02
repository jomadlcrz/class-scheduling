import type { BadgeTone } from "~/components/ui/badge";

/**
 * Department type vocabulary lives in the backend (app/enums.py) and is fetched
 * via enumService — only display tones are mapped here, by value.
 */
export const DEPARTMENT_TYPE_TONES: Record<string, BadgeTone> = {
  Academic: "emerald",
  Administrative: "slate",
};

export type Department = {
  id: number;
  abbrev: string;
  name: string;
  buildingName: string;
  /** Backend DepartmentType value — "Academic" or "Administrative". */
  departmentType: string;
  /** Programs offered by the department, as returned by GET /departments. */
  programs: { abbrev: string; name: string }[];
};

/** Buildings are referenced by id on create and update (backend expects buildingId). */
export type CreateDepartmentInput = {
  abbrev: string;
  name: string;
  buildingId: number;
  /** Backend DepartmentType value; omit to let the backend default to Academic. */
  departmentType?: string;
};

export type UpdateDepartmentInput = {
  abbrev?: string;
  name?: string;
  buildingId?: number;
  departmentType?: string;
};

/** Real backend department (integer id) — used where the API needs one. */
export type DepartmentOption = {
  id: number;
  abbrev: string;
  name: string;
};

/** GET /departments/:id response — a leaner shape than the nested-list `Department` (no buildingName join/programs). */
export type DepartmentDetail = {
  id: number;
  abbrev: string;
  name: string;
  buildingId: number;
  departmentType: string;
};

/** Shape of GET /departments/:id/delete-preview and the DELETE /departments/:id payload.
 * Programs cascade fully (same as a lone program delete); staff assignment still
 * blocks outright (accounts are never touched by this feature). */
export type DepartmentDeletePreview = {
  department: {
    department_id: number;
    department_name: string;
    department_abbrev: string;
  };
  /** False when staff are still assigned (blockers.staff > 0). */
  deletable: boolean;
  blockers: {
    staff: number;
  };
  will_delete: {
    /** Every active program that cascades exactly like DELETE /programs/:id would. */
    programs: { program_id: number; program_abbrev: string }[];
  };
};
