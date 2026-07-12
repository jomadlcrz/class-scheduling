import { ApiError, apiDelete, apiGet, apiMessage, apiPost, apiPut } from "~/lib/api";
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

/** POST /buildings — bulk endpoint; a single create sends a one-item list. Returns the backend message. */
async function create(input: CreateBuildingInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/buildings", {
    buildings: [{ buildingName: input.name, floorCount: input.floorCount }],
  });
  return apiMessage(data);
}

/** PUT /buildings/:id — returns the backend message. */
async function update(id: number, input: UpdateBuildingInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/buildings/${id}`, {
    ...(input.name !== undefined && { buildingName: input.name }),
    ...(input.floorCount !== undefined && { floorCount: input.floorCount }),
  });
  return apiMessage(data);
}

/** DELETE /buildings/:id — returns the backend message. */
async function remove(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/buildings/${id}`);
  return apiMessage(data);
}

export const buildingService = { list, create, update, remove };
