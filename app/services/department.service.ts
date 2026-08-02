import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import type { CreateDepartmentInput, Department, DepartmentDeletePreview, DepartmentDetail, UpdateDepartmentInput } from "~/types/department";

/** Departments CRUD against the facilities module (registrar_admin). */

type DepartmentsResponse = {
  departments: {
    department_id: number;
    department_abbrev: string;
    department_name: string;
    department_type: string;
    building_name: string;
    programs: { program_abbrev: string; program_name: string }[];
  }[];
};

function mapDepartments(data: DepartmentsResponse): Department[] {
  return data.departments.map((d) => ({
    id: d.department_id,
    abbrev: d.department_abbrev,
    name: d.department_name,
    buildingName: d.building_name,
    departmentType: d.department_type,
    programs: (d.programs ?? []).map((p) => ({ abbrev: p.program_abbrev, name: p.program_name })),
  }));
}

/** GET /departments — every active department, administrative offices included.
 * The backend answers an empty table with 404. */
async function list(): Promise<Department[]> {
  try {
    return mapDepartments(await apiGet<DepartmentsResponse>("/departments"));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

/** GET /departments/academic — same shape as list(), minus administrative offices
 * (e.g. OCR, MIS) that own no programs. Use this for pickers assigning academic
 * data (like a program) to a college. */
async function listAcademic(): Promise<Department[]> {
  try {
    return mapDepartments(await apiGet<DepartmentsResponse>("/departments/academic"));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

/** POST /departments — bulk endpoint; a single create sends a one-item list. Returns the backend message. */
async function create(input: CreateDepartmentInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/departments", {
    departments: [
      {
        buildingName: input.buildingName,
        departmentAbbrev: input.abbrev,
        departmentName: input.name,
        ...(input.departmentType !== undefined && { departmentType: input.departmentType }),
      },
    ],
  });
  return apiMessage(data);
}

/** PUT /departments/:id — abbrev, name, building, and type are updatable. Returns the backend message. */
async function update(id: number, input: UpdateDepartmentInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/departments/${id}`, {
    ...(input.abbrev !== undefined && { departmentAbbrev: input.abbrev }),
    ...(input.name !== undefined && { departmentName: input.name }),
    ...(input.buildingName !== undefined && { buildingName: input.buildingName }),
    ...(input.departmentType !== undefined && { departmentType: input.departmentType }),
  });
  return apiMessage(data);
}

/** DELETE /departments/:id — cascades through its programs after the caller echoes the department's abbreviation (uppercase-normalized). Returns the backend message. */
async function remove(id: number, confirmCode: string): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/departments/${id}`, { confirm: confirmCode });
  return apiMessage(data);
}

/** GET /departments/:id/delete-preview — read-only breakdown of what the delete would affect. */
async function getDeletePreview(id: number): Promise<DepartmentDeletePreview> {
  return apiGet<DepartmentDeletePreview>(`/departments/${id}/delete-preview`);
}

export type DeletedDepartment = {
  id: number;
  abbrev: string;
  name: string;
  deactivatedAt: string | null;
  cascadeArchived?: { programs: number };
};

type DepartmentRecycleBinResponse = {
  department_id: number;
  department_abbrev: string;
  department_name: string;
  deactivated_at: string | null;
  cascade_archived?: { programs: number };
}[];

/** GET /departments/recycle-bin — 404 → empty. */
async function listDeleted(): Promise<DeletedDepartment[]> {
  let data: DepartmentRecycleBinResponse;
  try {
    data = await apiGet<DepartmentRecycleBinResponse>("/departments/recycle-bin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((d) => ({
    id: d.department_id,
    abbrev: d.department_abbrev,
    name: d.department_name,
    deactivatedAt: d.deactivated_at,
    cascadeArchived: d.cascade_archived,
  }));
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
    department_type: string;
    building_id: number;
  }>(`/departments/${id}`);
  return {
    id: d.department_id,
    abbrev: d.department_abbrev,
    name: d.department_name,
    buildingId: d.building_id,
    departmentType: d.department_type,
  };
}

export const departmentService = { list, listAcademic, create, update, remove, getDeletePreview, listDeleted, restore, get };
