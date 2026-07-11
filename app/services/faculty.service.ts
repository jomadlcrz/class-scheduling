import { ApiError, apiGet, apiPost } from "~/lib/api";
import type { DepartmentOption } from "~/types/department";
import type { CreateFacultyAccountInput } from "~/types/faculty";

/**
 * Faculty service. `create` and `listDepartmentOptions` talk to the real
 * backend (super_admin + registrar modules).
 */

/** The backend creates the account, emails a temp password, and returns only a message. */
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

type DepartmentsResponse = {
  departments: {
    department_id: number;
    department_abbrev: string;
    department_name: string;
  }[];
};

/** Real backend departments for the account form's dropdown (integer ids). */
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

export const facultyService = { create, listDepartmentOptions };
