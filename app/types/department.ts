export type Department = {
  id: string;
  code: string;
  name: string;
  buildingId: string;
  buildingCode: string;
};

export type CreateDepartmentInput = Omit<Department, "id">;
export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

/** Real backend department (integer id) — used where the API needs one. */
export type DepartmentOption = {
  id: number;
  code: string;
  name: string;
};
