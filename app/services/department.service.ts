import { ApiError, apiGet, apiMessage, apiPatch, apiPost, apiPut } from "~/lib/api";
import { archiveService } from "~/services/archive.service";
import type { CreateDepartmentInput, Department, DepartmentDeletePreview, DepartmentDetail, UpdateDepartmentInput } from "~/types/department";
import type { Program } from "~/types/program";

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
    return mapDepartments(await apiGet<DepartmentsResponse>("/departments/"));
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

/** POST /departments/ — create one department. Returns the backend message. */
async function create(input: CreateDepartmentInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/departments/", {
    departmentAbbrev: input.abbrev,
    departmentName: input.name,
    buildingId: input.buildingId,
    ...(input.departmentType !== undefined && { departmentType: input.departmentType }),
  });
  return apiMessage(data);
}

/** PUT /departments/:id — abbrev, name, building, and type are updatable. Returns the backend message. */
async function update(id: number, input: UpdateDepartmentInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/departments/${id}`, {
    ...(input.abbrev !== undefined && { departmentAbbrev: input.abbrev }),
    ...(input.name !== undefined && { departmentName: input.name }),
    ...(input.buildingId !== undefined && { buildingId: input.buildingId }),
    ...(input.departmentType !== undefined && { departmentType: input.departmentType }),
  });
  return apiMessage(data);
}

/** DELETE /departments/:id — cascades through its programs after the caller echoes the department's abbreviation (uppercase-normalized). Returns the backend message. */
async function remove(id: number, confirmCode: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/departments/${id}/archive`, { confirm: confirmCode });
  return apiMessage(data);
}

/** GET /departments/:id/delete-preview — read-only breakdown of what the delete would affect. */
async function getDeletePreview(id: number): Promise<DepartmentDeletePreview> {
  const data = await apiGet<{
    department: DepartmentDeletePreview["department"];
    archivable: boolean;
    blockers: DepartmentDeletePreview["blockers"];
    willArchive: DepartmentDeletePreview["will_delete"];
  }>(`/departments/${id}/archive-preview`);
  return {
    department: data.department,
    deletable: data.archivable,
    blockers: data.blockers,
    will_delete: data.willArchive,
  };
}

type DeletedDepartment = {
  id: number;
  abbrev: string;
  name: string;
  deactivatedAt: string | null;
  cascadeArchived?: { programs: number };
};

/** GET /archive?category=departments. */
async function listDeleted(): Promise<DeletedDepartment[]> {
  const items = await archiveService.listCategoryItems("departments");
  return items.map((item) => {
    const [abbrev = "", ...nameParts] = item.label.split(" — ");
    return {
      id: item.entityId,
      abbrev,
      name: nameParts.join(" — ") || item.label,
      deactivatedAt: item.archivedAt,
      cascadeArchived: item.summary
        ? { programs: Number(item.summary.programs ?? 0) }
        : undefined,
    };
  });
}

/** PATCH /archive/department/:id/restore */
async function restore(id: number): Promise<string> {
  return archiveService.restore("department", id);
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

/** GET /departments/:id/programs — active programs owned by one department. */
async function listPrograms(id: number): Promise<Program[]> {
  const data = await apiGet<{
    department_abbrev: string;
    programs: {
      program_id: number;
      program_abbrev: string;
      program_name: string;
      program_type: string;
      program_length: number;
      program_description?: string | null;
    }[];
  }>(`/departments/${id}/programs`);

  return data.programs.map((p) => ({
    id: p.program_id,
    departmentAbbrev: data.department_abbrev,
    abbrev: p.program_abbrev,
    name: p.program_name,
    type: p.program_type,
    lengthYears: p.program_length,
    description: p.program_description,
  }));
}

export const departmentService = {
  list,
  listAcademic,
  listPrograms,
  create,
  update,
  remove,
  getDeletePreview,
  listDeleted,
  restore,
  get,
};
