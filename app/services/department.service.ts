import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type { CreateDepartmentInput, Department, DepartmentDetail, UpdateDepartmentInput } from "~/types/department";

/** Departments CRUD against the facilities module (registrar_admin). */

type DepartmentsResponse = {
  departments: {
    department_id: number;
    department_abbrev: string;
    department_name: string;
    building_name: string;
    programs: { program_abbrev: string; program_name: string }[];
  }[];
};

/** GET /departments — the backend answers an empty table with 404. */
async function list(): Promise<Department[]> {
  let data: DepartmentsResponse;
  try {
    data = await apiGet<DepartmentsResponse>("/departments");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.departments.map((d) => ({
    id: d.department_id,
    abbrev: d.department_abbrev,
    name: d.department_name,
    buildingName: d.building_name,
    programs: (d.programs ?? []).map((p) => ({ abbrev: p.program_abbrev, name: p.program_name })),
  }));
}

/** POST /departments — bulk endpoint; a single create sends a one-item list. Returns the backend message. */
async function create(input: CreateDepartmentInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/departments", {
    departments: [
      {
        buildingName: input.buildingName,
        departmentAbbrev: input.abbrev,
        departmentName: input.name,
      },
    ],
  });
  return apiMessage(data);
}

/** PUT /departments/:id — only the abbrev and name are updatable. Returns the backend message. */
async function update(id: number, input: UpdateDepartmentInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/departments/${id}`, {
    ...(input.abbrev !== undefined && { departmentAbbrev: input.abbrev }),
    ...(input.name !== undefined && { departmentName: input.name }),
  });
  return apiMessage(data);
}

/** DELETE /departments/:id — returns the backend message. */
async function remove(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/departments/${id}`);
  return apiMessage(data);
}

export type DeletedDepartment = { id: number; name: string; deactivatedAt: string | null };

type DepartmentRecycleBinResponse = { department_id: number; department_name: string; deactivated_at: string | null }[];

/** GET /departments/recycle-bin — 404 → empty. */
async function listDeleted(): Promise<DeletedDepartment[]> {
  let data: DepartmentRecycleBinResponse;
  try {
    data = await apiGet<DepartmentRecycleBinResponse>("/departments/recycle-bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((d) => ({ id: d.department_id, name: d.department_name, deactivatedAt: d.deactivated_at }));
}

/** PATCH /departments/:id/restore */
async function restore(id: number): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/departments/${id}/restore`);
  return apiMessage(data);
}

/** GET /departments/:id */
async function get(id: number): Promise<DepartmentDetail> {
  const d = await apiGet<{
    department_id: number;
    department_abbrev: string;
    department_name: string;
    building_id: number;
  }>(`/departments/${id}`);
  return { id: d.department_id, abbrev: d.department_abbrev, name: d.department_name, buildingId: d.building_id };
}

export const departmentService = { list, create, update, remove, listDeleted, restore, get };
