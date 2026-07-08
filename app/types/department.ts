export type Department = {
  id: string;
  code: string;
  name: string;
  buildingId: string;
  buildingCode: string;
};

export type CreateDepartmentInput = Omit<Department, "id">;
export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;
