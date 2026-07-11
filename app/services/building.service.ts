import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "~/lib/api";
import type { Building, CreateBuildingInput, UpdateBuildingInput } from "~/types/building";

/** Buildings CRUD against the facilities module (registrar_admin). */

type BuildingsResponse = {
  buildings: {
    building_id: number;
    building_name: string;
    floor_count: number;
  }[];
};

/** GET /buildings — the backend answers an empty table with 404. */
async function list(): Promise<Building[]> {
  let data: BuildingsResponse;
  try {
    data = await apiGet<BuildingsResponse>("/buildings");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.buildings.map((b) => ({
    id: b.building_id,
    name: b.building_name,
    floorCount: b.floor_count,
  }));
}

/** POST /buildings — bulk endpoint; a single create sends a one-item list. */
async function create(input: CreateBuildingInput): Promise<void> {
  await apiPost("/buildings", {
    buildings: [{ buildingName: input.name, floorCount: input.floorCount }],
  });
}

/** PUT /buildings/:id */
async function update(id: number, input: UpdateBuildingInput): Promise<void> {
  await apiPut(`/buildings/${id}`, {
    ...(input.name !== undefined && { buildingName: input.name }),
    ...(input.floorCount !== undefined && { floorCount: input.floorCount }),
  });
}

/** DELETE /buildings/:id */
async function remove(id: number): Promise<void> {
  await apiDelete(`/buildings/${id}`);
}

export const buildingService = { list, create, update, remove };
