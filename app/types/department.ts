export type Department = {
  id: number;
  abbrev: string;
  name: string;
  buildingName: string;
  /** Programs offered by the department, as returned by GET /departments. */
  programs: { abbrev: string; name: string }[];
};

/** Buildings are referenced by name on create; not updatable afterwards. */
export type CreateDepartmentInput = {
  abbrev: string;
  name: string;
  buildingName: string;
};

export type UpdateDepartmentInput = {
  abbrev?: string;
  name?: string;
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
};
