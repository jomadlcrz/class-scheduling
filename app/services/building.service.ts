import { ApiError, apiGet, apiMessage, apiPatch } from "~/lib/api";
import type { Building, BuildingArchivePreview, DeletedBuilding } from "~/types/building";

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

export type { DeletedBuilding };

type BuildingRecycleBinResponse = {
  building_id: number;
  building_name: string;
  deactivated_at: string | null;
  cascade_archived?: { rooms: number; departments: number; programs: number };
}[];

/** GET /buildings/recycle-bin — 404 → empty. Archiving a building cascades to its rooms. */
async function listDeleted(): Promise<DeletedBuilding[]> {
  let data: BuildingRecycleBinResponse;
  try {
    data = await apiGet<BuildingRecycleBinResponse>("/buildings/recycle-bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((b) => ({
    id: b.building_id,
    name: b.building_name,
    deactivatedAt: b.deactivated_at,
    cascadeArchived: b.cascade_archived,
  }));
}

/** PATCH /buildings/:id/restore — also restores rooms archived in the same archive call. */
async function restore(id: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/buildings/${id}/restore`);
  return apiMessage(data);
}

/** GET /buildings/:id */
async function get(id: number): Promise<Building> {
  const b = await apiGet<{ building_id: number; building_name: string; floor_count: number }>(`/buildings/${id}`);
  return { id: b.building_id, name: b.building_name, floorCount: b.floor_count };
}

export const buildingService = { list, archive, getArchivePreview, listDeleted, restore, get };
