import { ApiError, apiGet, apiPost } from "~/lib/api";
import type { DepartmentOption } from "~/types/department";
import {
  type RawFaculty,
  type CreateFacultyAccountInput,
  type Faculty,
  mapFaculty,
} from "~/types/faculty";

/**
 * Faculty service. `create`, `list`, and `listDepartmentOptions` talk to the
 * real API (super_admin + registrar modules).
 */

/** POST /super-admin/create-faculty-accounts — emails temp password. */
async function create(input: CreateFacultyAccountInput): Promise<void> {
  await apiPost("/super-admin/create-faculty-accounts", {
    departmentId: input.departmentId,
    firstName: input.firstName,
    ...(input.midName && { midName: input.midName }),
    lastName: input.lastName,
    // Omitted enum fields default to "N/A" (NOT_SPECIFIED) on the backend.
    ...(input.gender && { gender: input.gender }),
    ...(input.civilStatus && { civilStatus: input.civilStatus }),
    contact: { mobile: input.mobile, email: input.email },
    roleName: "Faculty",
  });
}

/** GET /super-admin/create-faculty-accounts — returns all faculty profiles. 404 → empty. */
async function list(): Promise<Faculty[]> {
  let data: RawFaculty[];
  try {
    data = await apiGet<RawFaculty[]>("/super-admin/create-faculty-accounts");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map(mapFaculty);
}

type DepartmentsResponse = {
  departments: {
    department_id: number;
    department_abbrev: string;
    department_name: string;
  }[];
};

/** GET /departments — real departments for the account form dropdown. */
async function listDepartmentOptions(): Promise<DepartmentOption[]> {
  let data: DepartmentsResponse;
  try {
    data = await apiGet<DepartmentsResponse>("/departments");
  } catch (err) {
    // The backend answers an empty departments table with 404.
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.departments.map((d) => ({
    id: d.department_id,
    code: d.department_abbrev,
    name: d.department_name,
  }));
}

export const facultyService = { create, list, listDepartmentOptions };
