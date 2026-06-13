export type Building = {
  id: string;
  name: string;
  code: string;
  floorCount: number;
};

export type CreateBuildingInput = Omit<Building, "id">;
export type UpdateBuildingInput = Partial<CreateBuildingInput>;
