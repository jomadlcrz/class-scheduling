import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut, apiUpload } from "~/lib/api";
import type { CreateDepartmentInput, Department, DepartmentDeletePreview, UpdateDepartmentInput } from "~/types/department";

/** Departments CRUD against the facilities module (registrar_admin). */

type DepartmentsResponse = {
  departments: {
    department_id: number;
    department_abbrev: string;
    department_name: string;
    department_type: string;
    building_name: string;
    programs: { program_abbrev: string; program_name: string }[];
    logo_url: string | null;
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
    logoUrl: d.logo_url,
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

/** POST /departments/ — create one department, with an optional logo.
 * Plain JSON when no logo is given; multipart/form-data (same camelCase fields, plus
 * a `logo` file) when one is — the backend accepts either body for this endpoint.
 * Returns the backend message. */
async function create(input: CreateDepartmentInput, logoFile?: File | null): Promise<string> {
  if (logoFile) {
    const formData = new FormData();
    formData.append("departmentAbbrev", input.abbrev);
    formData.append("departmentName", input.name);
    formData.append("buildingId", String(input.buildingId));
    if (input.departmentType !== undefined) formData.append("departmentType", input.departmentType);
    formData.append("logo", logoFile);
    const data = await apiUpload<{ message?: string }>("/departments/", formData);
    return apiMessage(data);
  }

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

/** POST /departments/:id/logo — replace the department logo. Field name `logo`. */
async function uploadLogo(id: number, file: File): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append("logo", file);
  const data = await apiUpload<{ message?: string; logo_url: string }>(`/departments/${id}/logo`, formData);
  return { url: data.logo_url, message: data.message ?? "" };
}

/** DELETE /departments/:id/logo — remove the current logo, if any. Returns the backend message. */
async function removeLogo(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/departments/${id}/logo`);
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

export const departmentService = {
  list,
  listAcademic,
  create,
  update,
  uploadLogo,
  removeLogo,
  remove,
  getDeletePreview,
};
