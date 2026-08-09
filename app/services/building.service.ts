import { ApiError, apiGet, apiMessage, apiPatch, apiPut } from "~/lib/api";
import type {
  Building,
  BuildingArchivePreview,
  UpdateBuildingInput,
} from "~/types/building";

/** Buildings read + archive against the facilities module (registrar_admin). */

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

/** PATCH /buildings/:id/archive — soft-deletes the building and its active rooms after
 * the caller echoes the building's own name (case-sensitively). Returns the backend message. */
async function archive(id: number, confirmText: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/buildings/${id}/archive`, { confirm: confirmText });
  return apiMessage(data);
}

/** GET /buildings/:id/archive-preview — read-only breakdown of what archival would affect. */
async function getArchivePreview(id: number): Promise<BuildingArchivePreview> {
  return apiGet<BuildingArchivePreview>(`/buildings/${id}/archive-preview`);
}

/** PUT /buildings/:id — partial update (buildingName, floorCount). */
async function update(id: number, input: UpdateBuildingInput): Promise<string> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.buildingName = input.name;
  if (input.floorCount !== undefined) body.floorCount = input.floorCount;
  const data = await apiPut<{ message?: string }>(`/buildings/${id}`, body);
  return apiMessage(data);
}

export const buildingService = { list, archive, getArchivePreview, update };
