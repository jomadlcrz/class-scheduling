export type Department = {
  id: number;
  code: string;
  name: string;
  buildingName: string;
  /** Programs offered by the department, as returned by GET /departments. */
  programs: { abbrev: string; name: string }[];
};

/** Buildings are referenced by name on create; not updatable afterwards. */
export type CreateDepartmentInput = {
  code: string;
  name: string;
  buildingName: string;
};

export type UpdateDepartmentInput = {
  code?: string;
  name?: string;
};

/** Real backend department (integer id) — used where the API needs one. */
export type DepartmentOption = {
  id: number;
  code: string;
  name: string;
};
