import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "~/lib/api";
import type { CreateDepartmentInput, Department, UpdateDepartmentInput } from "~/types/department";

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
    code: d.department_abbrev,
    name: d.department_name,
    buildingName: d.building_name,
    programs: (d.programs ?? []).map((p) => ({ abbrev: p.program_abbrev, name: p.program_name })),
  }));
}

/** POST /departments — bulk endpoint; a single create sends a one-item list. */
async function create(input: CreateDepartmentInput): Promise<void> {
  await apiPost("/departments", {
    departments: [
      {
        buildingName: input.buildingName,
        departmentAbbrev: input.code,
        departmentName: input.name,
      },
    ],
  });
}

/** PUT /departments/:id — only the code and name are updatable. */
async function update(id: number, input: UpdateDepartmentInput): Promise<void> {
  await apiPut(`/departments/${id}`, {
    ...(input.code !== undefined && { departmentAbbrev: input.code }),
    ...(input.name !== undefined && { departmentName: input.name }),
  });
}

/** DELETE /departments/:id */
async function remove(id: number): Promise<void> {
  await apiDelete(`/departments/${id}`);
}

export const departmentService = { list, create, update, remove };
